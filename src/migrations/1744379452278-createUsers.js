module.exports = class CreateUsers1744379452278 {
    name = 'CreateUsers1744379452278'

    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE \`users\`(
                id varchar(255) PRIMARY KEY NOT NULL UNIQUE,
                fullname varchar(255) NOT NULL,
                
            )    
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE \`user\``);
    }
}
