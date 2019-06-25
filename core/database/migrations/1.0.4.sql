DROP INDEX IF EXISTS public.trs_asset_index RESTRICT;
CREATE INDEX IF NOT EXISTS trs_asset_index ON public.trs USING GIN (asset);
