# Argo CD deployment (`argo/`)

GitOps manifests so this SDK app is auto-discovered by the Topia SDK-apps
ApplicationSet. No per-repo `Application` manifest and no CI workflow live here:
app creation is owned by the appset; image build + sync is owned by a
Terraform-templated CI workflow.

```
argo/
  services/<svc>/   one dir per independent Deployment (Deployment+Service+Ingress)
  overlays/<env>/   per service: ConfigMap (<svc>-config), SealedSecret (<svc>-secrets,
                    ciphertext only), KEDA scaler, keda-ns interceptor Ingress; drops
                    the direct Ingress; maps the image to the shared dev ECR
  envs/<env>/config.json   ApplicationSet generator params (incl. services[])
```

## Two-branch contract

- `main` = ONLY `argo/envs/*/config.json`, each WITH `"targetRevision": "dev"`. The
  appset's git-files generator reads these to detect the repo + envs; `targetRevision`
  points the generated Application at `dev` for the actual manifests.
- `dev` = the full argo tree (services/ + overlays/ + envs/ WITHOUT `targetRevision`).
  This is the deploy branch the cluster syncs from.

**Secrets:** no plaintext is committed. Each `<svc>-sealedsecret.yaml` holds only
ciphertext (sealed against the dev cluster cert, strict scope, per-env namespace);
the in-cluster sealed-secrets controller unseals it into `Secret <svc>-secrets`,
consumed by the Deployment via `envFrom`. Non-secret env (incl. the public
`INTERACTIVE_KEY`) lives in the committed `<svc>-config` ConfigMap.

## Environments

| Env | Service | Namespace | Host | Backend | Health |
| --- | ------- | --------- | ---- | ------- | ------ |
| `dev` | `race0` | `sdk-apps-dev` | race0-dev-topia.topia-rtsdk.com | api.topia.io | `/api/system/health` |
| `stg` | `stg-race0` | `sdk-apps-stg` | stg-race0-dev-topia.topia-rtsdk.com | api-stage.topia.io | `/api/system/health` |

Same image (`sdk-example:sdk-race`), different Topia backend + interactive keys per
env, and each scales to zero independently.

## Render locally

```sh
kubectl kustomize argo/overlays/dev
kubectl kustomize argo/overlays/stg
```
