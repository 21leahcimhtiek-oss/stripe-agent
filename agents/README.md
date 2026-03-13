# Multi-Market Deployment Agent & API Hunter

An autonomous agent system for deploying production apps to multiple marketplaces and discovering relevant APIs for GitHub repositories.

## 🚀 Features

### Multi-Market Deployment
- **Microsoft Store**: MSIX packaging, code signing, and automated submissions
- **Google Play**: AAB building, signing, and Play Console deployment
- **Vercel**: Web app and API deployment with CI/CD integration

### API Hunter
- Discovers APIs from multiple sources (PublicAPIs, RapidAPI, APYHub)
- Analyzes GitHub repositories for API relevance
- Generates integration recommendations

## 📁 Project Structure

```
agents/
├── deployment/
│   ├── multi-market-deploy.yml    # Main deployment workflow
│   └── store-listing-generator.py # Store listing generator
├── api-hunter/
│   ├── api-discovery-agent.py     # API discovery engine
│   └── github-repo-analyzer.py    # GitHub repository analyzer
└── shared/
    └── config.py                   # Shared configuration

.github/workflows/
└── copilot-setup-steps.yml         # GitHub Copilot environment setup
```

## 🔧 Setup

### 1. Configure Secrets

Copy the secrets template and fill in your credentials:

```bash
python agents/shared/config.py > .env
```

Required secrets for each platform:

#### Microsoft Store
- `MS_STORE_TENANT_ID` - Azure AD Tenant ID
- `MS_STORE_CLIENT_ID` - Azure AD App Client ID
- `MS_STORE_CLIENT_SECRET` - Azure AD App Secret
- `MS_STORE_APP_ID` - Microsoft Store App ID
- `AZURE_KEY_VAULT` - Azure Key Vault for code signing

#### Google Play
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` - Service account JSON
- `ANDROID_PACKAGE_NAME` - Your app's package name
- `ANDROID_KEYSTORE_BASE64` - Base64 encoded keystore

#### Vercel
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

### 2. Enable GitHub Copilot Setup Steps

The `copilot-setup-steps.yml` file customizes Copilot's development environment with:
- Node.js 20 for web deployments
- Java 17 for Android builds
- .NET 8 for MSIX packaging
- Python 3.11 for API hunter scripts
- Fastlane for Google Play deployment
- Azure CLI for Microsoft Store

## 🚀 Usage

### Deploy to All Markets

```bash
# Trigger via GitHub Actions
gh workflow run multi-market-deploy.yml -f target_market=all -f environment=production
```

### Deploy to Specific Market

```bash
# Microsoft Store only
gh workflow run multi-market-deploy.yml -f target_market=microsoft-store

# Google Play only
gh workflow run multi-market-deploy.yml -f target_market=google-play

# Vercel only
gh workflow run multi-market-deploy.yml -f target_market=vercel
```

### Run API Discovery

```bash
# Discover APIs
python agents/api-hunter/api-discovery-agent.py

# Analyze a GitHub repository
python agents/api-hunter/github-repo-analyzer.py owner/repo
```

### Generate Store Listings

```python
from agents.deployment.store_listing_generator import StoreListingGenerator, AppMetadata

metadata = AppMetadata(
    name="My App",
    package_name="com.example.myapp",
    version="1.0.0",
    description="My awesome app",
    short_description="An awesome app",
    category="productivity"
)

generator = StoreListingGenerator()
generator.generate_all_listings(metadata)
```

## 📊 Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Multi-Market Deployment                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Validate  │───>│    Build    │───>│    Sign     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                │            │
│         ┌──────────────────────────────────────┼────────┐   │
│         │                                      │        │   │
│         ▼                                      ▼        ▼   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Microsoft    │  │   Google     │  │   Vercel     │      │
│  │   Store      │  │    Play      │  │   Deploy     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│                           │                                 │
│                    ┌──────▼──────┐                         │
│                    │   Summary   │                         │
│                    └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Security

- All secrets stored in GitHub Environments
- Separate environments for staging/production
- Required approvals for production deployments
- Signed packages for all platforms

## 📝 Monetization Features

The agent supports:
- Subscription pricing tiers
- In-app purchase configuration
- Revenue tracking integration
- Store-specific revenue rules

## 🤝 Integration with GitHub Copilot

This project is optimized for GitHub Copilot Coding Agent:

1. **Environment Setup**: `copilot-setup-steps.yml` pre-installs all tools
2. **Context Awareness**: Clear documentation and structure
3. **Atomic Commits**: Each deployment is a separate, traceable action
4. **Branch Strategy**: Use `feature/<task-name>` for changes

## 📚 Further Reading

- [Microsoft Store Submission API](https://learn.microsoft.com/en-us/windows/apps/publish/store-submission-api)
- [Google Play Developer API](https://developers.google.com/android-publisher)
- [Vercel REST API](https://vercel.com/docs/rest-api)
- [GitHub Copilot Setup Steps](https://docs.github.com/copilot/customizing-copilot/adding-copilot-setup-steps)

## 📄 License

MIT License - See LICENSE file for details.