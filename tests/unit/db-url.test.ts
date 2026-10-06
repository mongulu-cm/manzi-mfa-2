import { describe, expect, it } from 'vitest'
import { localDatabaseEnvironment, localDatabaseUrl } from '../db/local-url.mjs'

describe('cible des fixtures PostgreSQL', () => {
  it('utilise la base Supabase locale par défaut', () => {
    expect(localDatabaseUrl()).toBe('postgresql://postgres:postgres@127.0.0.1:54322/postgres')
  })

  it.each([
    'postgresql://postgres:postgres@localhost:54322/postgres',
    'postgres://postgres:postgres@127.0.0.1:54322/postgres',
    'postgresql://postgres:postgres@[::1]:54322/postgres',
  ])('accepte une URI PostgreSQL loopback (%s)', (value) => {
    expect(localDatabaseUrl(value)).toBe(value)
  })

  it.each([
    'postgresql://localhost/postgres?host=remote.invalid',
    'postgresql://localhost/postgres?hostaddr=203.0.113.1',
    'postgresql://localhost/postgres?service=remote',
    'postgresql://localhost/postgres?%68ost=remote.invalid',
    'postgresql://localhost/postgres?sslmode=disable',
    'postgresql://localhost/postgres?',
    'postgresql://localhost/postgres#host=remote.invalid',
    'https://localhost/postgres',
    'file://localhost/postgres',
    'postgresql://remote.invalid/postgres',
    'postgresql://localhost.remote.invalid/postgres',
    'postgresql://localhost@remote.invalid/postgres',
    'postgresql://localhost,remote.invalid/postgres',
    'postgresql://127.0.0.1,remote.invalid/postgres',
    'postgresql://%6cocalhost/postgres',
    'postgresql://%31%32%37.0.0.1/postgres',
    'postgresql://%2Fvar%2Frun%2Fpostgresql/postgres',
    'postgresql://[::ffff:127.0.0.1]/postgres',
    'postgresql://localhost\n/postgres',
    ' postgres://localhost/postgres',
    'host=remote.invalid dbname=postgres',
    'not-a-url',
  ])('refuse une URI ambiguë ou pouvant changer la cible (%s)', (value) => {
    expect(() => localDatabaseUrl(value)).toThrow('Ces fixtures doivent être exécutées uniquement sur une base locale jetable')
  })

  it.each([
    'postgresql://private-user:private-password@remote.invalid/postgres',
    'postgresql://private-user:private-password@[localhost/postgres',
  ])('ne révèle pas les identifiants dans une erreur de validation', (value) => {
    expect(() => localDatabaseUrl(value)).toThrow(/^Ces fixtures doivent être exécutées uniquement sur une base locale jetable$/)
  })

  it('retire les réglages libpq de l’environnement transmis à psql', () => {
    const source = {
      PATH: '/usr/bin', SUPABASE_TEST_DB_URL: 'postgresql://localhost/postgres',
      PGHOST: 'remote.invalid', PGHOSTADDR: '203.0.113.1', PGSERVICE: 'remote',
      PGSERVICEFILE: '/tmp/service.conf', PGSYSCONFDIR: '/tmp', PGPORT: '5432',
      PGDATABASE: 'remote', PGOPTIONS: '-c search_path=malicious',
    }
    expect(localDatabaseEnvironment(source)).toEqual({
      PATH: source.PATH, SUPABASE_TEST_DB_URL: source.SUPABASE_TEST_DB_URL,
    })
    expect(source.PGHOSTADDR).toBe('203.0.113.1')
  })
})
