-- Reset ID sequences for all tables
-- Run with: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f scripts/reset-sequences.sql

\echo '🔄 Resetting ID sequences...'
\echo ''

ALTER SEQUENCE dishes_id_seq RESTART WITH 1;
\echo '✅ Reset dishes_id_seq'

ALTER SEQUENCE game_scores_id_seq RESTART WITH 1;
\echo '✅ Reset game_scores_id_seq'

ALTER SEQUENCE pasta_id_seq RESTART WITH 1;
\echo '✅ Reset pasta_id_seq'

ALTER SEQUENCE pasta_leaderboard_id_seq RESTART WITH 1;
\echo '✅ Reset pasta_leaderboard_id_seq'

\echo ''
\echo '✨ All sequences reset to 1'
