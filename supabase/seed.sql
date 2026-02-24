-- Seed test accounts for local development.
-- Profiles are auto-created by the on_auth_user_created trigger.
-- Credentials: password is "password123" for both accounts.

-- Test Client
insert into auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
) values (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'test-client@dev.local',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"client"}',
  false, '', '', '', ''
) on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'test-client@dev.local',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"test-client@dev.local","email_verified":true,"phone_verified":false}',
  'email',
  now(), now(), now()
) on conflict (provider_id, provider) do nothing;

-- Test Attorney
insert into auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
) values (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'test-attorney@dev.local',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"attorney"}',
  false, '', '', '', ''
) on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values (
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  'test-attorney@dev.local',
  '{"sub":"22222222-2222-2222-2222-222222222222","email":"test-attorney@dev.local","email_verified":true,"phone_verified":false}',
  'email',
  now(), now(), now()
) on conflict (provider_id, provider) do nothing;
