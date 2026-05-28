# 🛠️ AWS Setup Guide – Bharat Samachar Prototype

## Prerequisites
- AWS Account with **$200 credits** ✅
- AWS CLI installed (optional, but helpful)
- Python 3.11+ and Node.js 18+

---

## Step 1: Enable Amazon Bedrock Model Access

1. Go to **AWS Console → Amazon Bedrock → Model access** (ap-south-1)
2. Click **"Manage model access"**
3. Find **Anthropic → Claude 3 Sonnet** → Check the box
4. Click **"Request model access"** → Wait ~2 minutes for approval
5. ✅ Green status = Ready

> 💰 **Cost**: Claude 3 Sonnet = $0.003/1K input tokens. 100 articles ≈ $3

---

## Step 2: Create IAM User & Access Keys

1. Go to **IAM → Users → Create User**
2. Name: `bharat-samachar-dev`
3. Attach these policies:
   - `AmazonBedrockFullAccess`
   - `AmazonPollyFullAccess`
   - `TranslateFullAccess`
   - `AmazonDynamoDBFullAccess`
   - `AmazonS3FullAccess`
4. **Create Access Key** → Download CSV

---

## Step 3: Create S3 Bucket for Audio

1. Go to **S3 → Create Bucket**
2. Name: `bharat-samachar-audio` (must be globally unique, adjust if taken)
3. Region: **ap-south-1 (Mumbai)**
4. Uncheck "Block all public access" (for pre-signed URLs)
5. Enable versioning: OFF (not needed for prototype)
6. Click **Create bucket**

---

## Step 4: Configure `.env` File

```bash
# Copy the example file
cd d:\AI_For_Bharat\prototype\backend
copy .env.example .env
```

Edit the `.env` file with your actual credentials:
```
AWS_ACCESS_KEY_ID=AKIA...your_key...
AWS_SECRET_ACCESS_KEY=your_secret_key...
AWS_DEFAULT_REGION=ap-south-1
S3_BUCKET_NAME=bharat-samachar-audio
DYNAMO_TABLE_NAME=bharat-samachar-articles
```

> ⚠️ **Never commit `.env` to Git!** It's already in `.gitignore`

---

## Step 5: Install Backend Dependencies

```bash
cd d:\AI_For_Bharat\prototype\backend
pip install -r requirements.txt
```

For virtual environment (recommended):
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

## Step 6: Initialize AWS Resources (DynamoDB Table)

```bash
cd d:\AI_For_Bharat\prototype\backend
python -c "from services.dynamo_service import ensure_table_exists; ensure_table_exists()"
```

This creates the `bharat-samachar-articles` DynamoDB table automatically.

---

## Step 7: Start the Backend Server

```bash
cd d:\AI_For_Bharat\prototype\backend
uvicorn local_server:app --reload --port 8000
```

Test it: http://localhost:8000/health

---

## Step 8: Start the Frontend

```bash
cd d:\AI_For_Bharat\prototype\frontend
npm install
npm run dev
```

Open: **http://localhost:3000** 🎉

---

## Step 9: Optional – Deploy to AWS

### Frontend → AWS Amplify
```bash
# Push to GitHub first, then:
# AWS Console → Amplify → New App → Connect Repository
# Build: npm run build  |  Output: .next
```

### Backend → AWS Lambda + API Gateway
```bash
# Requires AWS SAM CLI
cd d:\AI_For_Bharat\prototype\infrastructure
sam build
sam deploy --guided
```

### Backend → Amazon ECS (Container)
```bash
docker build -t bharat-samachar-backend ./backend
# Push to ECR → Create ECS task → Create ALB
```

---

## 💰 Estimated AWS Costs for Prototype Testing

| Service | Usage | Est. Cost |
|---------|-------|-----------|
| Bedrock (Claude 3 Sonnet) | 100 articles | ~$3 |
| Amazon Polly | 100 audio clips | ~$1 |
| Amazon Translate | 100 articles | Free tier |
| DynamoDB | 100 items | Free tier |
| S3 | 100 MP3 files (~50MB) | Free tier |
| **Total** | 100 articles | **~$4–5** |

With **$200 credits**, you can process **thousands of articles!** 🚀

---

## 🔧 Troubleshooting

| Error | Fix |
|-------|-----|
| `AccessDeniedException: Bedrock` | Enable Claude model in Bedrock console |
| `NoCredentialsError` | Check `.env` has correct keys |
| `ResourceNotFoundException: DynamoDB` | Run the Step 6 init command |
| `NoSuchBucket: S3` | Create the bucket in Step 3 |
| `audio not available` | Check S3 bucket name in `.env` |
| Frontend shows CORS error | Ensure backend is running on port 8000 |
