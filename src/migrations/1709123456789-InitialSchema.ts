import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1709123456789 implements MigrationInterface {
  name = 'InitialSchema1709123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // await queryRunner.query(`
    //   CREATE TABLE "csv_data" (
    //     "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    //     "code" character varying NOT NULL,
    //     "data" jsonb NOT NULL,
    //     "userId" uuid NOT NULL,
    //     "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    //     CONSTRAINT "UQ_csv_data_code" UNIQUE ("code"),
    //     CONSTRAINT "PK_csv_data" PRIMARY KEY ("id"),
    //     CONSTRAINT "FK_csv_data_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    //   )
    // `);
    await queryRunner.query(`
      CREATE TABLE "csv_data" (
        "id" int NOT NULL,
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "value" int NOT NULL,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_csv_data_code" PRIMARY KEY ("code"),
        CONSTRAINT "FK_csv_data_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "csv_data"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
