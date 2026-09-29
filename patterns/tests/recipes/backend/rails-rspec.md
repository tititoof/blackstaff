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
4. **API des services** (`ServiceResult`) : `expect(result).to be_success` / `be_failure`,
   `result.data`, `result.errors`. Il n'existe PAS de `result.value` ni de `result.failure`.
5. **Données qui doivent exister AVANT l'appel : `let!`**, pas `let` (paresseux : créé après
   l'appel, il rend l'assertion vide de sens).
6. **Dates** : une date fixe `let(:today) { Date.new(2026, 9, 30) }` passée en `today:` ; des dates
   explicites (`Date.new(...)`, `Time.zone.local(2026, 9, 28, 12)`) ; jamais d'arithmétique de mois
   pour calculer une valeur attendue (`today - 3.months` → 30 ou 31 jours selon le mois).
7. **Requêtes** : `let(:user) { create(:user, :confirmed) }`, `let(:headers) { authentication_headers_for(user) }`,
   `get "/api/v1/...", headers: headers, as: :json`, puis `parsed_body[:cle]` (clés symboles) ;
   tester aussi `401` sans headers.
8. **Modèles** : `subject { build(:model) }` avant les matchers shoulda
   (`validate_uniqueness_of` a besoin d'un sujet valide).
9. **Style omakase** : guillemets doubles, `require "rails_helper"`, `described_class`,
   espaces dans les crochets de tableaux (`[ 1, 2 ]`), `subject` avant les `let`.

# Exemple (service de synchronisation avec client injecté)

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
