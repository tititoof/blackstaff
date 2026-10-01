---
type: Recipe
title: Specs RSpec (Rails 8, rubocop-rails-omakase)
---

# Règles

1. **Base réelle, jamais de stub ActiveRecord.** Crée les données avec FactoryBot
   (`create(:model, ...)`) et vérifie la base (`Model.find_by(...)`, `.count`).
   N'écris jamais `allow(Model).to receive(:where/:upsert/:upsert_all/:create!/:find_each)`,
   ni `instance_double(SyncRun)` : ces specs passent même quand le code est faux.
2. **HTTP simulé à la frontière avec WebMock**, jamais un client mocké dans une spec
   de client : `stub_request(:get, "http://<service>-test.example/<chemin>").with(query: { ... })`
   `.to_return(status: 200, body: payload.to_json, headers: { "Content-Type" => "application/json" })`.
   Les URLs de base de test sont de la forme `http://dolibarr-test.example/api/index.php`,
   `http://jenkins-test.example`, `http://recherche-entreprises-test.example`.
3. **Un double seulement pour un collaborateur INJECTÉ** (`described_class.call(client: client)`) :
   `let(:client) { instance_double(Jenkins::Client) }` + `allow(client).to receive(:builds).with(...).and_return([...])`.
   Seule autre exception : un service non injecté qui appelle une API externe (LLM, n8n) se stubbe à
   sa méthode de classe, avec un vrai `ServiceResult` :
   `allow(Projects::Reports::BuildProgressReportService).to receive(:call).with(...)`
   `.and_return(ServiceResult.new(success: true, data: { ... }))` (ou `success: false, errors: [ "..." ]`).
4. **API des services** (`ServiceResult`) : `expect(result).to be_success` / `be_failure`,
   `result.data`, `result.errors`. Il n'existe PAS de `result.value` ni de `result.failure`.
5. **Données qui doivent exister AVANT l'appel : `let!`**, pas `let` (paresseux : créé après
   l'appel, il rend l'assertion vide de sens).
6. **Dates** : une date fixe `let(:today) { Date.new(2026, 9, 30) }` passée en `today:` ; des dates
   explicites (`Date.new(...)`, `Time.zone.local(2026, 9, 28, 12)`) ; jamais d'arithmétique de mois
   pour calculer une valeur attendue (`today - 3.months` → 30 ou 31 jours selon le mois).
   **Pas de `travel_to` / `freeze_time` / `travel_back`** : les helpers de temps ne sont pas inclus
   dans `rails_helper` (→ `NoMethodError`). Pour un horodatage « maintenant », comparer avec
   `be_within(1.second).of(Time.current)`.
7. **Requêtes** : `let(:user) { create(:user, :confirmed) }`, `let(:headers) { authentication_headers_for(user) }`,
   `get "/api/v1/...", headers: headers, as: :json`, puis `parsed_body[:cle]` (clés symboles) ;
   tester aussi `401` sans headers et `404` pour un id inconnu (`/api/v1/projects/999999/...`).
   **Toujours le chemin littéral interpolé** (`post "/api/v1/projects/#{project.id}/reports/progress"`),
   **jamais un helper `*_path`** : leurs noms se devinent mal (`NoMethodError`). Voir l'exemple 2.
8. **Modèles** : `subject { build(:model) }` avant les matchers shoulda
   (`validate_uniqueness_of` a besoin d'un sujet valide). Un enum se teste par ses clés,
   `expect(described_class.statuses.keys).to match_array(%w[pending running])`, pas avec
   `have_db_column(...).with_options(default: 0)` (Rails relit le défaut comme `"pending"`).
9. **Style omakase** : guillemets doubles, `require "rails_helper"`, `described_class`,
   espaces dans les crochets de tableaux (`[ 1, 2 ]`), `subject` avant les `let`.
10. **Jobs mis en file** : l'adaptateur est Sidekiq (`Sidekiq::Testing.fake!`), PAS `:test`.
   `have_enqueued_job`, `have_been_enqueued`, `enqueued_jobs`, `ActiveJob::TestHelper` → erreur.
   Stubber la mise en file et vérifier l'appel :
   `allow(GenerateProgressReportJob).to receive(:perform_later)` puis
   `expect(GenerateProgressReportJob).to have_received(:perform_later).with(record.id)`
   (`not_to have_received` pour l'absence). Spec d'un job : `described_class.perform_now(id)`, puis `record.reload`.
11. **Colonnes `jsonb`** : relues avec des clés **chaînes**, même écrites avec des symboles →
   `expect(record.result).to eq({ "foo" => "bar" })`. Mais `parsed_body` symbolise en profondeur →
   `expect(parsed_body[:result]).to eq({ foo: "bar" })`.
12. **Webhook signé (HMAC, Svix…)** : la signature porte sur le corps EXACT reçu. Calcule-la sur une
   chaîne JSON fixe, puis poste CETTE chaîne telle quelle :
   `post "/api/v1/webhooks/x", params: raw_body, headers: signed_headers.merge("CONTENT_TYPE" => "application/json")`.
   **Jamais `as: :json` avec une chaîne** (Rails la ré-encode : le corps reçu ne correspond plus à la
   signature, 401). Le secret se lit dans les credentials de test, on ne les modifie pas
   (`Rails.application.credentials.x = ...` fuit vers toute la suite).

# Exemple 1 (service de synchronisation avec client injecté)

```ruby
require "rails_helper"

RSpec.describe Jenkins::SyncBuildsService do
  subject(:result) { described_class.call(client: client) }

  let(:client) { instance_double(Jenkins::Client) }
  let!(:job) { create(:jenkins_job, url: "https://jenkins.example/job/app/job/main/") }

  before do
    allow(client).to receive(:builds).with(job_url: job.url, limit: 50)
      .and_return([ { "number" => 7, "result" => "SUCCESS", "timestamp" => 1_759_140_000_000, "duration" => 90_000 } ])
  end

  it "stores the builds" do
    expect(result).to be_success
    build = JenkinsBuild.find_by(jenkins_job: job, number: 7)
    expect(build.built_at).to eq(Time.zone.at(1_759_140_000))
  end

  it "records a failed SyncRun when the API errors" do
    allow(client).to receive(:builds).and_raise(ApplicationClient::Error.new("500: boom", status: 500))

    expect(result).to be_failure
    expect(result.errors).to eq([ "500: boom" ])
    expect(SyncRun.last).to be_failed
  end
end
```

# Exemple 2 (request spec : auth, chemin littéral, mise en file)

```ruby
require "rails_helper"

RSpec.describe "Api::V1::Projects::Reports", type: :request do
  let(:user) { create(:user, :confirmed) }
  let(:headers) { authentication_headers_for(user) }
  let(:project) { create(:project) }

  it "requires authentication" do
    post "/api/v1/projects/#{project.id}/reports/progress", params: { period_start: "2026-08-01" }, as: :json
    expect(response).to have_http_status(:unauthorized)
  end

  it "enqueues the generation and returns the pending job" do
    allow(GenerateProgressReportJob).to receive(:perform_later)

    post "/api/v1/projects/#{project.id}/reports/progress",
         params: { period_start: "2026-08-01", period_end: "2026-08-26" }, headers: headers, as: :json

    expect(response).to have_http_status(:accepted)
    expect(parsed_body[:status]).to eq("pending")
    expect(GenerateProgressReportJob).to have_received(:perform_later).with(parsed_body[:job_id])
  end
end
```
