---
type: Example
title: Command — exemple Traitement par lot (Batch)
tags: [command, batch, rails, laravel, symfony]
---

# Application du pattern sur un traitement par lot

Exécuter une même Command sur une collection d'éléments — avec parallélisme,
suivi de progression et gestion des échecs partiels.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Command}` | `SendInvoiceCommand` |
| `{Receiver}` | `InvoiceService` |
| Collection | Liste d'ids de factures à envoyer |

# Rails — batch via ActiveJob + tracking

```ruby
# app/commands/send_invoices_batch_command.rb
class SendInvoicesBatchCommand < BaseCommand
  def initialize(invoice_ids:, user_id:)
    @invoice_ids = invoice_ids
    @user_id     = user_id
  end

  def execute
    return failure("Liste vide") if @invoice_ids.empty?

    results = { success: [], failed: [] }

    @invoice_ids.each do |invoice_id|
      # Chaque envoi individuel est lui-même une Command asynchrone
      SendInvoiceJob.perform_later(
        invoice_id: invoice_id,
        user_id:    @user_id
      )
      results[:success] << invoice_id
    rescue => e
      Rails.logger.error("[Batch] Failed to enqueue #{invoice_id}: #{e.message}")
      results[:failed] << { id: invoice_id, error: e.message }
    end

    success(results)
  end
end

# app/jobs/send_invoice_job.rb
class SendInvoiceJob < ApplicationJob
  queue_as :invoices

  def perform(invoice_id:, user_id:)
    invoice = Invoice.find(invoice_id)
    return if invoice.sent?   # idempotence

    InvoiceService.new.send!(invoice)
    invoice.update!(sent_at: Time.current, sent_by: user_id)
  end
end
```

# Laravel — Job Batching natif (Bus::batch)

```php
// Batch natif Laravel — tracking et callbacks inclus
public function handle(SendInvoicesBatchCommand $command): array
{
    $jobs = collect($command->invoiceIds)->map(
        fn(int $id) => new SendInvoiceJob($id, $command->userId)
    );

    $batch = Bus::batch($jobs)
        ->name('send-invoices-batch')
        ->allowFailures()  // ne pas annuler les jobs restants si un échoue
        ->progress(function (Batch $batch) {
            Log::info('[Batch] Progress', [
                'processed' => $batch->processedJobs(),
                'total'     => $batch->totalJobs,
                'progress'  => $batch->progress() . '%',
            ]);
        })
        ->then(function (Batch $batch) {
            Log::info('[Batch] All jobs completed', ['batch_id' => $batch->id]);
        })
        ->catch(function (Batch $batch, \Throwable $e) {
            Log::error('[Batch] First job failure', ['error' => $e->getMessage()]);
        })
        ->finally(function (Batch $batch) {
            // Toujours exécuté, succès ou échec
        })
        ->dispatch();

    return [
        'batch_id'   => $batch->id,
        'total_jobs' => $batch->totalJobs,
        'status_url' => route('batches.show', $batch->id),
    ];
}
```

# Symfony — batch via Messenger + progression

```php
// src/Handler/SendInvoicesBatchHandler.php
class SendInvoicesBatchHandler implements MessageHandlerInterface
{
    public function __construct(
        private readonly MessageBusInterface $bus,
        private readonly InvoiceRepository  $invoiceRepository,
    ) {}

    public function __invoke(SendInvoicesBatchCommand $command): void
    {
        $invoices = $this->invoiceRepository->findByIds($command->invoiceIds);

        foreach ($invoices as $invoice) {
            // Dispatcher chaque envoi individuel comme une Command asynchrone
            $this->bus->dispatch(new SendInvoiceMessage(
                invoiceId: $invoice->getId(),
                userId:    $command->userId,
            ));
        }
        // Messenger dispatche tout en bulk — efficace et parallélisable
    }
}

// Suivi de progression via un compteur Redis ou une table de suivi
// (Symfony n'a pas de batch natif équivalent à Laravel Bus::batch —
// implémenter via un enregistrement BatchRun en base avec un compteur
// incrémenté dans chaque handler individuel)
```

# Gestion des échecs partiels

Un batch avec `allowFailures()` (Laravel) ou sans transaction globale
(Rails/Symfony) peut avoir des succès partiels. Toujours :

1. Logger les échecs individuels avec l'id concerné.
2. Permettre de relancer uniquement les éléments en échec.
3. Rendre chaque Command individuelle idempotente — si un job est rejoué
   après un succès partiel du batch, il ne doit pas dupliquer l'action.