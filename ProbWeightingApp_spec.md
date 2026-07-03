# ProbWeightingApp Web版 仕様書

## 概要
Prelec(1998, Econometrica)のCompound Invariance公理を
直接検証するWebアプリケーション。
被験者が4ステップのインタラクティブな手順で無差別点を特定し、
公理の後件が成立するかを直接検証する。

## 技術スタック
- **フロントエンド**: React (Vite)
- **バックエンド**: FastAPI (Python)
- **デプロイ**: Render

---

## 実験の理論的背景

### Compound Invariance公理（Prelec 1998, Definition 1）
以下が成立するとき：
- $(x, p) \sim (y, q)$：確率pでxを得るくじと確率qでyを得るくじが無差別
- $(x, r) \sim (y, s)$

ならば：
- $(x', p^N) \sim (y', q^N)$ ならば $(x', r^N) \sim (y', s^N)$

### 実験の4ステップ構造（MATLABアプリと同一）
1. **Step 1**：$(x, p) \sim (?, q)$ → 被験者がyを入力（無差別となる金額）
2. **Step 2**：$(x, r) \sim (y, ?)$ → 被験者がsを入力（無差別となる確率）
3. **Step 3**：$(x', p^N, ?) \sim (x', q^N)$ → 被験者がy'を入力
4. **Step 4**：$(x', r^N)$ vs $(y', s^N)$ → X好む / ほとんど無差別 / Y好む

公理が成立すれば Step 4 は「ほとんど無差別」になるはず。

---

## MATLABアプリからの改善点

### 改善1：確率グリッドをNに応じて制約
- $p^N \geq 0.05$ かつ $q^N \geq 0.05$ かつ $r^N \geq 0.05$ を保証
- Prelec(1998)の固定点・変曲点である $1/e \approx 0.37$ 付近を重点サンプリング

```
確率グリッド候補：[0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8]
制約：p > q（MATLABと同様）かつ p^N >= 0.05 かつ q^N >= 0.05 かつ r^N >= 0.05
```

### 改善2：NをBetween Subjectで割り当て、各被験者5試行に設定
- full mode：学籍番号に基づき N=2 または N=3 のどちらかを割り当てる
- pilot mode：N=2 に固定
- 各被験者：5試行

### 改善3：N割り当てのブロック化
```
full mode：学籍番号最後2桁の mod 4 が 0/1 なら N=2、2/3 なら N=3
pilot mode：N=2
```
同一被験者内で N=2 と N=3 を両方実施せず、被験者間で N を分ける。

### 改善4：入力値のバリデーション強化
- Step 2（s入力）：$s^N \geq 0.05$ のチェックを追加
- 違反する場合は再入力を促すメッセージを表示

---

## 画面構成

### 画面0：セットアップ画面
- 学籍番号入力欄（テキスト）
- 氏名入力欄（テキスト）
- 「実験を始める」ボタン
- バリデーション：両方未入力の場合エラー

### 画面1：Step 1（試行ごと）
表示：
```
(試行N/5)
(p=0.XX, x=XX円) と無差別になる (p=0.XX, x=?) を答えてください
```
入力：y（1〜100,000,000の数値）
ボタン：「次へ」

### 画面2：Step 2（試行ごと）
表示：
```
(試行N/5)
(p=0.XX, x=XX円) と無差別になる (p=?, x=XX円) を答えてください
```
入力：s（0〜1の小数）
バリデーション：$s^N \geq 0.05$ でない場合「その確率では次のステップで確率が小さくなりすぎます。別の値を入力してください」
ボタン：「次へ」

### 画面3：Step 3（試行ごと）
表示：
```
(試行N/5)
(p=0.XXX, x=XX円) と無差別になる (p=0.XXX, x=?) を答えてください
※ 確率はp^Nとq^Nの値を表示
```
入力：y'（1〜100,000,000の数値）
ボタン：「次へ」

### 画面4：Step 4（試行ごと）
表示：
```
(試行N/5)
以下の2つのくじを比べてください：

X: (確率 0.XXX で XX円)
Y: (確率 0.XXX で XX円)
```
ボタン（3択）：
- 「Xを好む」
- 「ほとんど無差別」
- 「Yを好む」

### 画面5：終了画面
- 「実験が終了しました。ありがとうございました。」
- CSVダウンロードボタン

---

## ブロック間の説明画面

現在の CI module は各被験者5試行のみで、N=2/N=3 のブロック切り替えは行わない。

---

## 試行の生成ロジック（バックエンド）

### 確率グリッド
```python
PROB_GRID = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8]
AMOUNT_GRID = list(range(10, 110, 10))  # 10〜100（10刻み）
```

CI module では、学籍番号尾号が偶数なら high amount（10倍）、奇数なら low amount（1倍）を割り当てる。

### 試行生成の制約
```python
def generate_trial(N, amount_multiplier):
    while True:
        p = random.choice(PROB_GRID)
        q = random.choice(PROB_GRID)
        r = random.choice(PROB_GRID)
        if (p > q and
            p**N >= 0.05 and
            q**N >= 0.05 and
            r**N >= 0.05):
            break
    x = random.choice(AMOUNT_GRID) * amount_multiplier
    x_prime = random.choice(AMOUNT_GRID) * amount_multiplier
    return {"p": p, "q": q, "r": r, "x": x, "x_prime": x_prime, "N": N}
```

### 全5試行の生成
- full mode：学籍番号で割り当てられた N=2 または N=3 の5試行
- pilot mode：N=2 の5試行
- セッション開始時にバックエンドで全5試行を事前生成してセッションに保存

---

## データ記録（1行 = 1試行）

| カラム名 | 型 | 内容 |
|---------|-----|------|
| StudentID | string | 学籍番号 |
| Name | string | 氏名 |
| Trial | integer | 試行番号（1〜5） |
| Block | integer | ブロック（現在は1） |
| N | integer | 累乗数（2または3） |
| student_id_last_digit | string | 学籍番号尾号 |
| amount_level | string | CI 金額水準（low/high） |
| amount_multiplier | float | CI 金額倍率（1または10） |
| p | float | 確率p |
| q | float | 確率q |
| r | float | 確率r |
| x | integer | 金額x（金額水準反映後） |
| x_prime | integer | 金額x'（金額水準反映後） |
| y | float | Step1で入力したy（無差別金額） |
| s | float | Step2で入力したs（無差別確率） |
| y_prime | float | Step3で入力したy'（無差別金額） |
| pN | float | p^N |
| qN | float | q^N |
| rN | float | r^N |
| sN | float | s^N |
| choice | string | Step4の選択（X/Indifferent/Y） |
| ci_satisfied | boolean | 無差別を選択したか（公理成立の判定） |
| Timestamp | string | 記録日時 |

---

## バックエンドAPI（FastAPI）

### `POST /api/session/start`
セッション開始・5試行を生成

**リクエスト：**
```json
{
  "student_id": "12345",
  "name": "山田太郎"
}
```

**レスポンス：**
```json
{
  "session_id": "uuid",
  "trials": [
    {"trial": 1, "block": 1, "N": 2, "p": 0.5, "q": 0.4, "r": 0.6, "x": 50, "x_prime": 30},
    ...
  ]
}
```

### `POST /api/ci-results`
CI trial result を1件保存

**リクエスト：**
```json
{
  "session_id": "uuid",
  "student_id": "12345",
  "name": "山田太郎",
  "trial": 1,
  "block": 1,
  "N": 2,
  "p": 0.5, "q": 0.4, "r": 0.6,
  "x": 50, "x_prime": 30,
  "y": 45, "s": 0.48, "y_prime": 28,
  "pN": 0.25, "qN": 0.16, "rN": 0.36, "sN": 0.2304,
  "choice": "Indifferent",
  "ci_satisfied": true
}
```

### `GET /api/ci-results/{student_id}/csv`
CSVダウンロード
ファイル名：`CI_{student_id}_{YYYYMMDD_HHMMSS}.csv`

### `GET /api/ci-results/summary`
全被験者の結果サマリー（研究者用）
- 試行ごとのci_satisfied率
- Block別・N別の集計

### `POST /api/pwf-results`
PWF module task results を保存

### `POST /api/session/{session_id}/pwf-complete`
PWF module の完了状態を保存

### `GET /api/pwf-results/{student_id}/csv`
PWF CSVダウンロード
ファイル名：`PWF_{student_id}_{YYYYMMDD_HHMMSS}.csv`

---

## フロントエンド構成（React）

```
src/
├── App.jsx                    # メイン・画面切り替え・セッション管理
├── components/
│   ├── SetupScreen.jsx        # セットアップ画面
│   ├── Step1Screen.jsx        # y入力
│   ├── Step2Screen.jsx        # s入力（バリデーション付き）
│   ├── Step3Screen.jsx        # y'入力
│   ├── Step4Screen.jsx        # 3択選択
│   ├── BlockBreakScreen.jsx   # ブロック間休憩画面
│   └── FinishScreen.jsx       # 終了・CSVダウンロード
├── hooks/
│   └── useSession.js          # セッション・試行管理
└── api/
    └── client.js              # FastAPIとの通信
```

---

## バックエンド構成（FastAPI）

```
backend/
├── main.py              # FastAPIアプリ本体・CORS設定
├── trial_generator.py   # 試行生成ロジック
├── models/
│   └── result.py        # Pydanticモデル
└── requirements.txt
```

---

## UIデザインの注意点

- 確率は小数点3桁まで表示（例：0.125）
- 金額は「XX円」形式で表示
- Step 4のXとYのボタンは左右に大きく配置
- 「ほとんど無差別」は中央に配置
- 進捗バー（試行N/5）を全画面上部に表示
- full mode では、学籍番号で割り当てられた N=2 または N=3 のみを表示

---

## Claude Codeへの指示文

```
この仕様書（ProbWeightingApp_spec.md）と
添付のMATLABアプリ（ProbWeightingApp.mlapp）を参照して、
Compound Invariance公理検証実験のWebアプリを作成してください。

フォルダ構成：
- frontend/（React + Vite）
- backend/（FastAPI）

MATLABアプリからの主な改善点：
1. 確率グリッドをp^N >= 0.05の制約付きに変更
2. 試行数を5試行に設定（full mode は N=2 または N=3 を被験者間で割当）
3. N割り当てを学籍番号に基づいて deterministic に実施
4. Step 2でs^N >= 0.05のバリデーションを追加
5. ci_satisfied（無差別を選択したか）をデータに記録

重要な注意点：
- セッション開始時に全5試行をバックエンドで事前生成する
- 確率は小数点3桁まで表示
- CORSはlocalhost:5173、5174と後で設定するRenderのURLを許可

まずbackendから作成し、次にfrontendを作成してください。
```
