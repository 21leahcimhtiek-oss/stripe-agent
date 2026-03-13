"""
Agent Configuration Module
Shared configuration for Multi-Market Deployment Agent and API Hunter
"""

import os
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from pathlib import Path


@dataclass
class MarketConfig:
    """Configuration for a deployment market"""
    name: str
    enabled: bool = True
    environment: str = "production"
    auto_deploy: bool = False
    require_approval: bool = True
    secrets_prefix: str = ""
    
    # Market-specific settings
    microsoft_store: Dict = field(default_factory=dict)
    google_play: Dict = field(default_factory=dict)
    vercel: Dict = field(default_factory=dict)


@dataclass
class APICredential:
    """API credential configuration"""
    name: str
    env_var: str
    required: bool = True
    description: str = ""
    default: Optional[str] = None


class AgentConfig:
    """Main configuration class for the agent system"""
    
    # Secret names for each market
    MARKET_SECRETS = {
        "microsoft_store": [
            APICredential("MS_STORE_TENANT_ID", "MS_STORE_TENANT_ID", description="Azure AD Tenant ID"),
            APICredential("MS_STORE_CLIENT_ID", "MS_STORE_CLIENT_ID", description="Azure AD App Client ID"),
            APICredential("MS_STORE_CLIENT_SECRET", "MS_STORE_CLIENT_SECRET", description="Azure AD App Secret"),
            APICredential("MS_STORE_APP_ID", "MS_STORE_APP_ID", description="Microsoft Store App ID"),
            APICredential("AZURE_KEY_VAULT", "AZURE_KEY_VAULT", description="Azure Key Vault URL for signing"),
            APICredential("AZURE_CLIENT_ID", "AZURE_CLIENT_ID", description="Azure Client for code signing"),
            APICredential("AZURE_CLIENT_SECRET", "AZURE_CLIENT_SECRET", description="Azure Secret for code signing"),
        ],
        "google_play": [
            APICredential("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", 
                         description="Google Play Service Account JSON"),
            APICredential("ANDROID_PACKAGE_NAME", "ANDROID_PACKAGE_NAME", description="Android package name"),
            APICredential("ANDROID_KEYSTORE_BASE64", "ANDROID_KEYSTORE_BASE64", description="Keystore base64 encoded"),
            APICredential("ANDROID_KEYSTORE_PASSWORD", "ANDROID_KEYSTORE_PASSWORD", description="Keystore password"),
            APICredential("ANDROID_KEY_ALIAS", "ANDROID_KEY_ALIAS", description="Key alias"),
            APICredential("ANDROID_KEY_PASSWORD", "ANDROID_KEY_PASSWORD", description="Key password"),
        ],
        "vercel": [
            APICredential("VERCEL_TOKEN", "VERCEL_TOKEN", description="Vercel API Token"),
            APICredential("VERCEL_ORG_ID", "VERCEL_ORG_ID", description="Vercel Organization ID"),
            APICredential("VERCEL_PROJECT_ID", "VERCEL_PROJECT_ID", description="Vercel Project ID"),
        ],
        "github": [
            APICredential("GITHUB_TOKEN", "GITHUB_TOKEN", description="GitHub Personal Access Token"),
        ],
    }
    
    # API Hunter sources
    API_SOURCES = {
        "publicapis": {
            "url": "https://api.publicapis.org/entries",
            "enabled": True,
            "rate_limit": 10,  # requests per second
        },
        "publicapis_dev": {
            "url": "https://publicapis.dev/api/apis",
            "enabled": True,
            "rate_limit": 10,
        },
        "rapidapi": {
            "url": "https://rapidapi.com/hub",
            "enabled": True,
            "requires_auth": True,
        },
    }
    
    # Pricing configuration
    PRICING_TIERS = {
        "free": {"monthly_price": 0, "features": ["basic"]},
        "starter": {"monthly_price": 9.99, "features": ["basic", "priority_support"]},
        "pro": {"monthly_price": 29.99, "features": ["basic", "priority_support", "advanced_analytics", "custom_integrations"]},
        "enterprise": {"monthly_price": 99.99, "features": "all"},
    }
    
    @classmethod
    def get_required_secrets(cls, market: str) -> List[APICredential]:
        """Get required secrets for a market"""
        return cls.MARKET_SECRETS.get(market, [])
    
    @classmethod
    def validate_secrets(cls, market: str) -> Dict[str, bool]:
        """Validate that required secrets are set"""
        results = {}
        for cred in cls.get_required_secrets(market):
            value = os.getenv(cred.env_var)
            results[cred.name] = bool(value)
        return results
    
    @classmethod
    def generate_secrets_template(cls) -> str:
        """Generate a template for required secrets"""
        template = ["# Agent Secrets Configuration", ""]
        
        for market, creds in cls.MARKET_SECRETS.items():
            template.append(f"## {market.upper()}")
            for cred in creds:
                req = "[REQUIRED]" if cred.required else "[OPTIONAL]"
                template.append(f"# {req} {cred.description}")
                template.append(f"{cred.env_var}=")
            template.append("")
        
        return "\n".join(template)


# Environment configurations
ENVIRONMENTS = {
    "development": {
        "vercel_env": "preview",
        "google_play_track": "internal",
        "auto_deploy": True,
    },
    "staging": {
        "vercel_env": "preview",
        "google_play_track": "internal",
        "auto_deploy": True,
    },
    "production": {
        "vercel_env": "production",
        "google_play_track": "production",
        "auto_deploy": False,
        "require_approval": True,
    },
}


def get_environment_config(env: str) -> Dict:
    """Get configuration for an environment"""
    return ENVIRONMENTS.get(env, ENVIRONMENTS["development"])


if __name__ == "__main__":
    # Print secrets template
    print(AgentConfig.generate_secrets_template())