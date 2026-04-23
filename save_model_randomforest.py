import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from imblearn.over_sampling import SMOTE
import json
import os

df = pd.read_csv('Teen_Mental_Health_Dataset.csv')

df_model = df.copy()

le = LabelEncoder()
cat_cols = ['gender', 'platform_usage', 'social_interaction_level']

for col in cat_cols:
    df_model[col] = le.fit_transform(df_model[col])

X = df_model.drop('depression_label', axis=1)
y = df_model['depression_label']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

smote = SMOTE(random_state=42)
X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)

rf_model = RandomForestClassifier(
    n_estimators      = 200,
    max_depth         = 10,
    min_samples_split = 5,
    min_samples_leaf  = 2,
    max_features      = 'sqrt',
    random_state      = 42,
    n_jobs            = -1
)

rf_model.fit(X_train_smote, y_train_smote)

# Konversi model ke format JSON
def rf_to_json(rf_model):
    trees_data = []

    for tree in rf_model.estimators_:
        t = tree.tree_
        tree_dict = {
            'children_left'  : t.children_left.tolist(),
            'children_right' : t.children_right.tolist(),
            'feature'        : t.feature.tolist(),
            'threshold'      : t.threshold.tolist(),
            'value'          : t.value.tolist(),
            'n_node_samples' : t.n_node_samples.tolist(),
            'impurity'       : t.impurity.tolist()
        }
        trees_data.append(tree_dict)

    model_json = {
        'n_estimators'       : rf_model.n_estimators,
        'max_depth'          : rf_model.max_depth,
        'min_samples_split'  : rf_model.min_samples_split,
        'min_samples_leaf'   : rf_model.min_samples_leaf,
        'max_features'       : rf_model.max_features,
        'n_classes'          : rf_model.n_classes_,
        'n_features'         : rf_model.n_features_in_,
        'feature_names'      : rf_model.feature_names_in_.tolist(),
        'classes'            : rf_model.classes_.tolist(),
        'feature_importances': rf_model.feature_importances_.tolist(),
        'trees'              : trees_data
    }

    return model_json

# Create the model directory if it doesn't exist
model_dir = 'models'
os.makedirs(model_dir, exist_ok=True)

# Define the full path to save the model
model_path = os.path.join(model_dir, 'random_forest_model.json')

# Save the model
model_json = rf_to_json(rf_model)
with open(model_path, 'w') as f:
    json.dump(model_json, f)

print(f"Model saved to {model_path}")