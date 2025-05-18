// src/entities/AiModel.js

const { EntitySchema } = require('typeorm');

const AiModel = new EntitySchema({
  name: 'AiModel', // Name of the entity
  tableName: 'ai_model', // Table name in MySQL
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    name: {
      type: 'varchar',
      length: 255,
    },
    modelPath: {
      type: 'varchar',
      length: 255,
    },
    status: {
      type: 'varchar',
      length: 255,
    },
    backupModelPath: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    metadata: {
      type: 'text',
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    updatedAt: {
      type: 'timestamp',
      nullable: true,
    },
  },
});

module.exports = AiModel;
