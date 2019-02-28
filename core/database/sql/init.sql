create table migrations
(
  id   varchar(25) not null
    constraint migrations_pkey
    primary key,
  name text        not null
);

create table block
(
  id                   char(64)  not null primary key,
  version              integer   not null,
  created_at           integer   not null,
  height               integer   not null,
  previous_block_id    char(64) references block on delete set null,
  transaction_count    integer   not null,
  amount               bigint    not null,
  fee                  bigint    not null,
  payload_hash         char(64)  not null,
  generator_public_key char(64)  not null,
  signature            char(128) not null
);

create table trs
(
  id                char(64)  not null primary key,
  block_id          char(64)  not null references block on delete cascade,
  type              smallint  not null,
  created_at        integer   not null,
  sender_public_key char(64)  not null,
  sender_address    bigint    not null,
  recipient_address bigint,
  amount            bigint    not null,
  fee               bigint    not null,
  signature         char(128) not null,
  second_signature  char(128),
  salt              char(32)  not null default '' :: bpchar,
  asset             json      not null default '{}' :: json
);

create index trs_sender_address
  on trs (sender_address);

create index trs_recipient_address
  on trs (recipient_address);

create table round
(
  height_start      integer   primary key,
  height_finish     integer   not null,
  slots             json      not null default '{}' :: json
);
