-- ResourcePolicy.userId era texto solto: sem chave estrangeira e sem cascade.
-- Excluir um usuario deixava a alcada de acesso dele no banco para sempre.

-- Limpa as orfas antes de criar a restricao. Sem isto, a FK falha ao ser criada em
-- qualquer banco onde ja se excluiu um usuario que tinha politicas.
DELETE FROM "ResourcePolicy"
WHERE "userId" IS NOT NULL
  AND "userId" NOT IN (SELECT "id" FROM "User");

-- AddForeignKey
ALTER TABLE "ResourcePolicy" ADD CONSTRAINT "ResourcePolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
