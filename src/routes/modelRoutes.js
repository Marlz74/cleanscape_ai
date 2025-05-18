// src/routes/modelRoutes.js

const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const AiModel = require("../entities/AiModel"); // Import the entity
const { getManager } = require("typeorm");
const tf = require("@tensorflow/tfjs-node"); // TensorFlow.js for Node.js
const { AppDataSource } = require("../../ormconfig");


const router = express.Router();

// Create a new model

/**
 * @swagger
 * /models:
 *   post:
 *     summary: Create a new AI model
 *     description: Create and initialize a new AI model with a given name and sample dataset to train.
 *     operationId: createModel
 *     tags:
 *       - Model
 *     requestBody:
 *       description: The details of the model to be created, including the name of the model and an optional sample dataset for training.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the AI model.
 *                 example: "NodePriorityModel"
 *               sampleData:
 *                 type: array
 *                 description: A sample dataset with feature values to initialize the model's training.
 *                 items:
 *                   type: object
 *                   properties:
 *                     age:
 *                       type: integer
 *                       description: The age of the node in the system.
 *                       example: 5
 *                     depth:
 *                       type: integer
 *                       description: The depth in the tree of the node.
 *                       example: 2
 *                     noiseLevel:
 *                       type: number
 *                       format: float
 *                       description: The noise level of the node when removed from the system.
 *                       example: 0.4
 *                     nodeType:
 *                       type: integer
 *                       description: The type of the node (0 for child, 1 for parent).
 *                       example: 1
 *                     label:
 *                       type: number
 *                       format: float
 *                       description: The target value indicating the priority for removal.
 *                       example: 0.9
 *     responses:
 *       201:
 *         description: Successfully created the AI model.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The unique identifier of the newly created model.
 *                   example: "d1a7c5e0-fd92-4d76-95f8-0a7a45d39b38"
 *                 name:
 *                   type: string
 *                   description: The name of the model.
 *                   example: "NodePriorityModel"
 *                 modelPath:
 *                   type: string
 *                   description: The file path to the trained model.
 *                   example: "/trained/d1a7c5e0-fd92-4d76-95f8-0a7a45d39b38"
 *                 status:
 *                   type: string
 *                   description: The current status of the model.
 *                   example: "not-trained"
 *       400:
 *         description: Bad request. Model name is required or invalid dataset format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Model name is required"
 *       500:
 *         description: Internal server error. Something went wrong while creating the model.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error creating model"
 */
router.post("/", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Model name is required" });
  }

  const modelId = uuidv4(); // Generate unique ID for the model
  const modelPath = path.join(__dirname, `../trained/${modelId}`); // Model path to store the trained model

  // Ensure the model directory exists
  const modelDir = path.dirname(modelPath);
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }

  // Create the model (initialized but not trained)
  try {
    const ai_model = tf.sequential();
    ai_model.add(
      tf.layers.dense({ units: 10, inputShape: [4], activation: "relu" })
    ); // Example layer
    ai_model.add(tf.layers.dense({ units: 1, activation: "sigmoid" })); // Output layer

    // Compile the model
    ai_model.compile({
      optimizer: "adam",
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    // Dummy data for initializing weights (just for the sake of saving the model)
    const dummyData = tf.randomNormal([10, 4]); // 10 samples with 4 features each
    const dummyLabels = tf.randomNormal([10, 1]); // 10 labels

    // Train the model on the dummy data (1 epoch, just to get some weights)
    await ai_model.fit(dummyData, dummyLabels, { epochs: 1 });

    // Save the model to disk
    await ai_model.save(`file://${modelPath}`);
  



    // Save model metadata to the database
    const newModel = {
      id: modelId,
      name,
      modelPath: `/trained/${modelId}`,
      status: "not-trained", // Model is not actually trained but initialized
    };


    const savedModel = await AppDataSource.getRepository(AiModel).save(newModel);

    return res.status(201).json(savedModel);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error creating model" });
  }
});

/**
 * @swagger
 * /models:
 *   get:
 *     summary: Get a list of all AI models
 *     description: This endpoint retrieves all AI models from the database.
 *     responses:
 *       200:
 *         description: A list of AI models.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The unique ID of the AI model.
 *                     example: "3b8f8b7d-b33b-4ab1-bf1d-9dcb9bff4f95"
 *                   name:
 *                     type: string
 *                     description: The name of the AI model.
 *                     example: "My Model"
 *                   modelPath:
 *                     type: string
 *                     description: The file path where the model is stored.
 *                     example: "/trained/3b8f8b7d-b33b-4ab1-bf1d-9dcb9bff4f9"
 *                   status:
 *                     type: string
 *                     description: The current status of the model (e.g., 'not-trained', 'trained').
 *                     example: "not-trained"
 *                   backupModelPath:
 *                     type: string
 *                     description: The backup file path, if available.
 *                     example: "/models/backup/3b8f8b7d-b33b-4ab1-bf1d-9dcb9bff4f95-backup"
 *                   metadata:
 *                     type: string
 *                     description: Metadata about the AI model (optional).
 *                     example: "{\"createdBy\": \"admin\"}"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: The creation timestamp of the model.
 *                     example: "2023-07-25T15:10:00Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: The last updated timestamp of the model.
 *                     example: "2023-07-25T15:10:00Z"
 *       500:
 *         description: Internal server error when fetching the models.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating that there was an issue fetching the models.
 *                   example: "Error fetching models"
 */

// Get all models
router.get("/", async (req, res) => {
  try {
    // const manager = getManager();
    // const models = await manager.find(AiModel);
    const models = await AppDataSource.getRepository(AiModel).find();
    return res.json(models);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching models" });
  }
});

/**
 * @swagger
 * /models/{id}/train:
 *   put:
 *     summary: Incrementally train an existing AI model with a provided dataset using TensorFlow.js
 *     description: This endpoint triggers incremental training on an existing model using the provided dataset. The model will be loaded from the filesystem, retrained using the new dataset, and saved back, overwriting the existing model.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The unique ID of the AI model to train.
 *         required: true
 *         schema:
 *           type: string
 *           example: "3b8f8b7d-b33b-4ab1-bf1d-9dcb9bff4f95"
 *     requestBody:
 *       description: Dataset to train the model.
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 age:
 *                   type: integer
 *                   description: Age of the node.
 *                   example: 5
 *                 depth:
 *                   type: integer
 *                   description: Depth of the node.
 *                   example: 2
 *                 noiseLevel:
 *                   type: number
 *                   description: Noise level of the node.
 *                   example: 0.4
 *                 nodeType:
 *                   type: integer
 *                   description: Type of node.
 *                   example: 1
 *                 label:
 *                   type: number
 *                   description: Label for the node.
 *                   example: 0.9
 *     responses:
 *       200:
 *         description: The model has been successfully trained and updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the trained model.
 *                   example: "3b8f8b7d-b33b-4ab1-bf1d-9dcb9bff4f95"
 *                 name:
 *                   type: string
 *                   description: The name of the AI model.
 *                   example: "MyModel"
 *                 modelPath:
 *                   type: string
 *                   description: The path to the trained model file.
 *                   example: "/trained/3b8f8b7d-b33b-4ab1-bf1d-9dcb9bff4f95"
 *                 status:
 *                   type: string
 *                   description: The current status of the model (e.g., "trained").
 *                   example: "trained"
 *       404:
 *         description: Model not found with the given ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating that the model was not found.
 *                   example: "Model not found"
 *       500:
 *         description: Internal server error when training the model.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating an issue with training the model.
 *                   example: "Error training model"
 */
router.put("/:id/train", async (req, res) => {
  try {
    const { id } = req.params;
    let dataset = req.body;

    if (!Array.isArray(dataset) || dataset.length === 0) {
      return res.status(400).json({
        message: "Invalid dataset. Please provide an array of training data.",
      });
    }
    // const manager = getManager();
    // const model = await manager.findOne(AiModel, { where: { id } });
    const model = await AppDataSource.getRepository(AiModel).findOneBy({ id })
    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    // Convert dataset to tensor format
    const inputFeatures = dataset.map((data) => [
      data.age,
      data.depth,
      data.noiseLevel,
      data.nodeType,
    ]); // Features for model
    const outputLabels = dataset.map((data) => data.label); // Labels for model

    const xs = tf.tensor(inputFeatures); // Features as input tensor
    const ys = tf.tensor(outputLabels); // Labels as output tensor

    // Load the existing model from the modelPath
    const modelPath = path.join(__dirname, "..", model.modelPath); // Path to the existing model

    const existingModel = await tf.loadLayersModel(
      `file://${modelPath}/model.json`
    );
    existingModel.compile({
      optimizer: "adam",
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    // Perform incremental training on the existing model
    await existingModel.fit(xs, ys, { epochs: 10 });

    // Overwrite the existing model with the newly trained one
    await existingModel.save(`file://${modelPath}`);

    // Update the model's status and modelPath in the database
    model.status = "trained";
    model.modelPath = `/trained/${id}`; // Path where the trained model is saved
    await manager.save(AiModel, model);

    return res.json(model); // Return the trained model details
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error training model", error });
  }
});

/**
 * @swagger
 * /models/{id}/test:
 *   post:
 *     summary: Test the trained model by providing a dataset and getting the top N nodes sorted by prediction.
 *     description: This endpoint allows you to test the trained model by sending a dataset of nodes and getting the top N nodes sorted by predicted score.
 *     operationId: testModel
 *     tags:
 *       - Model
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the model to test.
 *         schema:
 *           type: string
 *           example: '12345-abcde-67890-fghij'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dataset
 *               - numberOfNodes
 *             properties:
 *               dataset:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     age:
 *                       type: integer
 *                       description: Age of the node
 *                       example: 5
 *                     depth:
 *                       type: integer
 *                       description: Depth of the node
 *                       example: 2
 *                     noiseLevel:
 *                       type: number
 *                       format: float
 *                       description: Noise level of the node
 *                       example: 0.4
 *                     nodeType:
 *                       type: integer
 *                       description: Type of the node (e.g., 0 or 1)
 *                       example: 1
 *               numberOfNodes:
 *                 type: integer
 *                 description: The number of top nodes to return based on prediction scores.
 *                 example: 10
 *     responses:
 *       '200':
 *         description: Successfully tested the model and returned the top nodes.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nodes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       age:
 *                         type: integer
 *                       depth:
 *                         type: integer
 *                       noiseLevel:
 *                         type: number
 *                         format: float
 *                       nodeType:
 *                         type: integer
 *                       predictionScore:
 *                         type: number
 *                         format: float
 *                         description: The prediction score assigned by the model.
 *                         example: 0.85
 *       '404':
 *         description: Model not found.
 *       '500':
 *         description: Error testing model.
 */
// Test a model
router.post("/:id/test", async (req, res) => {
  const { id } = req.params;
  const { dataset, numberOfNodes } = req.body; // Expecting dataset and number of nodes to be returned

  if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
    return res
      .status(400)
      .json({ message: "Dataset is required and must be a non-empty array" });
  }

  if (numberOfNodes <= 0 || numberOfNodes > dataset.length) {
    return res
      .status(400)
      .json({ message: "Invalid number of nodes specified" });
  }

  try {
    const manager = getManager();
    const model = await manager.findOne(AiModel, { where: { id } });

    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    // Load the model from the file system
    const modelPath = path.join(__dirname, `../trained/${model.id}/model.json`); // Path to the model file
    const loadedModel = await tf.loadLayersModel(`file://${modelPath}`);

    // Prepare the dataset for prediction (convert to tensor)
    const inputData = tf.tensor(
      dataset.map((data) => [
        data.age,
        data.depth,
        data.noiseLevel,
        data.nodeType,
      ])
    );

    // Run predictions using the loaded model
    const predictions = loadedModel.predict(inputData);

    // Convert predictions to an array (assuming the model returns scores)
    const predictionResults = predictions.arraySync();

    // Combine the dataset with the predictions (each node now has a predicted score)
    const nodesWithScores = dataset.map((node, index) => ({
      ...node,
      score: predictionResults[index][0], // Assuming single output (score) per node
    }));

    // Sort nodes by predicted score (descending order)
    nodesWithScores.sort((a, b) => b.score - a.score);

    // Return the top N nodes based on the number of nodes requested
    const topNodes = nodesWithScores.slice(0, numberOfNodes);

    return res.json({ topNodes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error testing model" });
  }
});

/**
 * @swagger
 * /models/{id}/download:
 *   get:
 *     summary: Download a trained AI model
 *     description: This endpoint allows the user to download the trained AI model file based on the provided model ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The unique ID of the AI model to download.
 *         required: true
 *         schema:
 *           type: string
 *           example: "3b8f8b7d-b33b-4ab1-bf1d-9dcb9bff4f95"
 *     responses:
 *       200:
 *         description: The model file has been successfully downloaded.
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *               description: The binary content of the model file.
 *       404:
 *         description: Model not found with the given ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating that the model was not found.
 *                   example: "Model not found"
 *       500:
 *         description: Internal server error when downloading the model.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating an issue with downloading the model.
 *                   example: "Error downloading model"
 */

// Download a model
router.get("/:id/download", async (req, res) => {
  const { id } = req.params;
  try {
    // const manager = getManager();
    // const model = await manager.findOne(AiModel, { where: { id } });
    const model = await AppDataSource.getRepository(AiModel).findOneBy({ id })

    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    // Send the model file to the client
    res.download(model.modelPath, `${id}`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error downloading model" });
  }
});

/**
 * @swagger
 * /models/{id}:
 *   delete:
 *     summary: Delete an AI model
 *     description: This endpoint deletes an AI model that is no longer needed, including its model file. This action cannot be undone.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The unique ID of the AI model to delete.
 *         required: true
 *         schema:
 *           type: string
 *           example: "3b8f8b7d-b33b-4ab1-bf1d-9dcb9bff4f95"
 *     responses:
 *       200:
 *         description: The model has been successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message indicating the model was deleted.
 *                   example: "Model deleted successfully"
 *       404:
 *         description: Model not found with the given ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating that the model was not found.
 *                   example: "Model not found"
 *       500:
 *         description: Internal server error when deleting the model.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating an issue with deleting the model.
 *                   example: "Error deleting model"
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // const manager = getManager();
    const model = await AppDataSource.getRepository(AiModel).findOneBy({ id })

    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    const modelDir = path.join(__dirname, `..${model.modelPath}`);

    // Delete directory and all contents (recursive)
    fs.rmSync(modelDir, { recursive: true, force: true });

    // Remove model from database
    await AppDataSource.getRepository(AiModel).delete({ id });
    return res.json({ message: "Model deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting model" });
  }
});

module.exports = router;