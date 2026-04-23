import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from imblearn.over_sampling import SMOTE
import xgboost as xgb

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

xgb_model = xgb.XGBClassifier(
    n_estimators    = 200,
    max_depth       = 5,
    learning_rate   = 0.1,
    subsample       = 0.8,
    colsample_bytree= 0.8,
    eval_metric     = 'logloss',
    random_state    = 42,
    verbosity       = 0
)

xgb_model.fit(
    X_train_smote, y_train_smote,
    eval_set=[(X_train_smote, y_train_smote), (X_test, y_test)],
    verbose=False
)

xgb_model.save_model('xgboost_model.json')
print("Model saved to xgboost_model.json")
