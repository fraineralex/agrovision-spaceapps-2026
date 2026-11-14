# AI assistance: Codex (OpenAI), 2026-11-14; Frainer review pending.
"""Buffered spatial holdout of weak labels, followed by an explicitly preliminary fit."""
from collections import Counter

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import GroupShuffleSplit
from shapely.ops import unary_union

from common import MODEL
from features import FEATURE_NAMES


def estimator():
    return RandomForestClassifier(n_estimators=300, min_samples_leaf=3,
                                  max_features='sqrt', class_weight='balanced',
                                  random_state=42, n_jobs=-1)


def fit_target(records, target, expected_classes):
    eligible = [i for i, r in enumerate(records) if r[target] is not None
                and all(v is not None for v in r['features'].values())]
    counts = Counter(records[i][target] for i in eligible)
    result = {'status': 'insufficient_weak_labels', 'classes': expected_classes,
              'weakLabelCounts': dict(counts), 'eligibleCount': len(eligible),
              'independentGroundTruthCount': 0, 'fieldAccuracy': None,
              'evaluationType': 'spatial_holdout_agreement_with_weak_rules',
              'limitation': 'Labels use the same NDVI features as the model. Agreement is circular and does not establish field accuracy or irrigation detection.',
              'validation': None}
    if any(counts[c] < 3 for c in expected_classes):
        result['reason'] = 'Fewer than three weak labels per class; training withheld'
        return result, {}
    X = np.array([[records[i]['features'][f] for f in FEATURE_NAMES] for i in eligible])
    y = np.array([records[i][target] for i in eligible])
    centroids = [records[i]['geometry'].centroid for i in eligible]
    groups = np.array([f'{int(p.x//1000)}_{int(p.y//1000)}' for p in centroids])
    result['status'] = 'prototype_unvalidated'
    if len(set(groups)) >= 4:
        train, test = next(GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42).split(X, y, groups))
        test_geometry = unary_union([records[eligible[i]]['geometry'] for i in test])
        train = np.array([i for i in train if records[eligible[i]]['geometry'].distance(test_geometry) > 100], dtype=int)
        result['split'] = {'method': 'GroupShuffleSplit', 'seed': 42, 'blockSizeM': 1000,
                       'bufferM': 100, 'trainCount': len(train), 'testCount': len(test),
                       'trainGroups': sorted(set(groups[train])), 'testGroups': sorted(set(groups[test])),
                       'trainClassCounts': dict(Counter(y[train])), 'testClassCounts': dict(Counter(y[test]))}
        enough = all(np.sum(y[train] == c) >= 5 and np.sum(y[test] == c) >= 1 for c in expected_classes)
        if enough:
            model = estimator().fit(X[train], y[train])
            predicted = model.predict(X[test])
            result['status'] = 'prototype_weakly_supervised'
            result['validation'] = {
                'accuracy': accuracy_score(y[test], predicted),
                'macroF1': f1_score(y[test], predicted, labels=expected_classes, average='macro', zero_division=0),
                'confusionMatrix': confusion_matrix(y[test], predicted, labels=expected_classes).tolist(),
                'perClass': classification_report(y[test], predicted, labels=expected_classes, output_dict=True, zero_division=0),
                'unit': 'fraction', 'scale': 'parcel', 'quality': 'preliminary', 'confidence': None,
                'sourceId': 'weak-rules-v1',
                'minimumClassSupport': int(min(np.sum(y[test] == c) for c in expected_classes)),
                'interpretation': 'Descriptive agreement only; rare-class support is too small for generalization',
                'note': 'One spatial holdout; no field labels; no confidence interval; no tuning against holdout'}
            result['featureImportance'] = dict(zip(FEATURE_NAMES, model.feature_importances_.tolist()))
        else:
            result['reason'] = 'Fixed spatial holdout lacks at least five train and one test unit per class; split was not searched for favorable metrics'
        result['validationAssignments'] = [{'parcelId': f'sj-unit-{records[eligible[i]]["label"]:04d}',
          'split': split, 'group': groups[i], 'weakLabel': y[i]} for split, indices in [('train', train), ('test', test)] for i in indices]
    else:
        result['reason'] = 'Fewer than four spatial blocks; evaluation withheld'
    # Fit the demo estimator on all labels even if validation was unavailable;
    # never turn training-set performance into a validation metric.
    final = estimator().fit(X, y)
    MODEL.mkdir(parents=True, exist_ok=True)
    joblib.dump({'model': final, 'features': FEATURE_NAMES,
                 'status': result['status']}, MODEL / f'{target}.joblib')
    result['finalFitCount'] = len(y)
    result['featureImportanceFinalFit'] = dict(zip(FEATURE_NAMES, final.feature_importances_.tolist()))
    predictions = {}
    for r in records:
        # Refuse extrapolation into WorldCover trees, grass, water or urban units.
        in_domain = r['crop_fraction'] >= 0.6 if target == 'water_weak_label' else r['agricultural_fraction'] >= 0.6
        if in_domain and all(r['features'][f] is not None for f in FEATURE_NAMES):
            probabilities = final.predict_proba([[r['features'][f] for f in FEATURE_NAMES]])[0]
            k = int(np.argmax(probabilities))
            predictions[r['label']] = {'class': str(final.classes_[k]),
                   'confidence': float(probabilities[k]), 'validationStatus': result['status'],
                   'probabilities': dict(zip(final.classes_, probabilities.tolist()))}
    return result, predictions
