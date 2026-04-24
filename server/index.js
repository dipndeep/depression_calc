import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ─── Load XGBoost model ───────────────────────────────────────────────────────
const modelPath = join(__dirname, 'xgboost_model.json');
const modelJson = JSON.parse(readFileSync(modelPath, 'utf-8'));

const trees         = modelJson.learner.gradient_booster.model.trees;
const baseScoreRaw  = modelJson.learner.learner_model_param.base_score;
const baseScore     = parseFloat(baseScoreRaw.replace('[', '').replace(']', '').trim());
const learningRate  = 0.1;   // kept as passed from XGBoostClassifier (eta=0.1)
const numTrees      = trees.length;

/**
 * Traverse a single decision tree and return its leaf value.
 * XGBoost JSON layout:
 *   left_children[i]  — left child index  (-1 = leaf)
 *   right_children[i] — right child index (-1 = leaf)
 *   split_indices[i]  — feature index to split on
 *   split_conditions[i] — threshold value
 *   base_weights[i]   — leaf output value (when node is leaf)
 */
function traverseTree(tree, features) {
  let node = 0;
  while (true) {
    const left  = tree.left_children[node];
    const right = tree.right_children[node];
    if (left === -1 && right === -1) {
      // Leaf node
      return tree.base_weights[node];
    }
    const featureIdx  = tree.split_indices[node];
    const threshold   = tree.split_conditions[node];
    const featureVal  = features[featureIdx];
    // default_left = 0 means go right on missing; XGBoost uses <= for left branch
    if (featureVal <= threshold) {
      node = left;
    } else {
      node = right;
    }
  }
}

/**
 * Run inference: sum raw scores from all trees, convert logit → probability.
 * XGBoost stores base_score as the initial prediction (in probability space for
 * binary:logistic with boost_from_average=1).  We transform it to log-odds,
 * then add tree outputs scaled by learning_rate, then apply sigmoid.
 */
function predict(features) {
  // Convert base_score (0.5) to log-odds
  const initLogOdds = Math.log(baseScore / (1 - baseScore)); // = 0 when base=0.5

  let score = initLogOdds;
  for (const tree of trees) {
    score += learningRate * traverseTree(tree, features);
  }

  // Sigmoid
  const probability = 1 / (1 + Math.exp(-score));
  const prediction  = probability >= 0.5 ? 1 : 0;
  return { prediction, probability };
}

// ─── Feature encoding (must match training) ──────────────────────────────────
// Feature order: age, gender, daily_social_media_hours, platform_usage,
//   sleep_hours, screen_time_before_sleep, academic_performance,
//   physical_activity, social_interaction_level, stress_level,
//   anxiety_level, addiction_level
function encodeFeatures(body) {
  const genderMap = { female: 0, male: 1 };
  const platformMap = { Both: 0, Instagram: 1, TikTok: 2 };
  const socialMap = { High: 0, Low: 1, Medium: 2 };

  return [
    parseFloat(body.age),
    genderMap[body.gender] ?? 0,
    parseFloat(body.daily_social_media_hours),
    platformMap[body.platform_usage] ?? 0,
    parseFloat(body.sleep_hours),
    parseFloat(body.screen_time_before_sleep),
    parseFloat(body.academic_performance),
    parseFloat(body.physical_activity),
    socialMap[body.social_interaction_level] ?? 0,
    parseFloat(body.stress_level),
    parseFloat(body.anxiety_level),
    parseFloat(body.addiction_level),
  ];
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', trees: numTrees });
});

app.post('/api/predict', (req, res) => {
  try {
    const features = encodeFeatures(req.body);

    // Basic validation
    if (features.some(isNaN)) {
      return res.status(400).json({ error: 'Invalid or missing input fields.' });
    }

    const result = predict(features);
    return res.json({
      prediction:  result.prediction,
      probability: parseFloat(result.probability.toFixed(4)),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Prediction failed.', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🧠  Teen Depression API running on http://localhost:${PORT}`);
  console.log(`   Loaded ${numTrees} XGBoost trees\n`);
});
