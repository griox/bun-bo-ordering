# Deploy PgBouncer

## Goal
Optimize database connection pooling by deploying PgBouncer to sit between the microservices and PostgreSQL, resolving K6 timeouts.

## Tasks
- [ ] Task 1: Create `pgbouncer-values.yaml` with Npgsql-compatible settings → Verify: File exists with `transaction` mode and `ignoreStartupParameters`.
- [ ] Task 2: Install Bitnami PgBouncer via Helm in `postgresql` namespace → Verify: Pod `pgbouncer-0` is Running.
- [ ] Task 3: Update `app-config.yaml` to point `Postgres__Host` to `pgbouncer` → Verify: ConfigMap is updated.
- [ ] Task 4: Rollout restart backend microservices → Verify: `order`, `payment`, `catalog`, `identity`, `promotion` pods are restarted and healthy.

## Done When
- [ ] Microservices connect successfully to the database through PgBouncer without throwing connection refusal errors.
