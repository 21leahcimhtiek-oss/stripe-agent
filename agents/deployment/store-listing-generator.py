#!/usr/bin/env python3
"""
Store Listing Generator
Generates Microsoft Store and Google Play store listings from app metadata
"""

import json
import os
from dataclasses import dataclass, field
from typing import List, Optional, Dict
from datetime import datetime
from pathlib import Path


@dataclass
class AppMetadata:
    """App metadata for store listings"""
    name: str
    package_name: str
    version: str
    description: str
    short_description: str
    category: str
    keywords: List[str] = field(default_factory=list)
    screenshots: List[str] = field(default_factory=list)
    icons: Dict[str, str] = field(default_factory=dict)
    promo_video: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    privacy_url: Optional[str] = None
    terms_url: Optional[str] = None
    features: List[str] = field(default_factory=list)
    whats_new: Optional[str] = None
    age_rating: str = "Everyone"
    price: str = "Free"
    has_in_app_purchases: bool = False


@dataclass
class MicrosoftStoreListing:
    """Microsoft Store listing data"""
    app_name: str
    package_family_name: str
    version: str
    description: str
    short_description: str
    keywords: List[str]
    category: str
    age_rating: str
    pricing: Dict
    features: List[str]
    screenshots: List[Dict]
    store_logo: Dict
    promotional_images: Dict
    release_notes: str
    privacy_url: str
    website_url: str
    support_email: str


@dataclass
class GooglePlayListing:
    """Google Play Store listing data"""
    app_name: str
    package_name: str
    version: str
    full_description: str
    short_description: str
    title: str
    category: str
    content_rating: str
    pricing: str
    screenshots: Dict[str, List[str]]
    feature_graphic: str
    promo_video: Optional[str]
    release_notes: str
    privacy_policy_url: str
    website_url: str
    email: str


class StoreListingGenerator:
    """Generates store listings for multiple platforms"""
    
    # Category mappings between stores
    CATEGORY_MAPPINGS = {
        # App category -> Microsoft Store, Google Play
        "productivity": ("Productivity", "PRODUCTIVITY"),
        "entertainment": ("Entertainment", "ENTERTAINMENT"),
        "education": ("Education", "EDUCATION"),
        "games": ("Games", "GAME"),
        "social": ("Social", "SOCIAL"),
        "utilities": ("Utilities", "TOOLS"),
        "lifestyle": ("Lifestyle", "LIFESTYLE"),
        "finance": ("Finance", "FINANCE"),
        "health": ("Health & Fitness", "HEALTH_AND_FITNESS"),
        "music": ("Music", "MUSIC_AND_AUDIO"),
        "photo": ("Photo & Video", "PHOTOGRAPHY"),
        "business": ("Business", "BUSINESS"),
        "developer": ("Developer Tools", "LIBRARIES_AND_DEMO"),
    }
    
    # Age rating mappings
    AGE_RATING_MAPPINGS = {
        "everyone": ("3+", "Everyone"),
        "everyone_10": ("7+", "Everyone 10+"),
        "teen": ("12+", "Teen"),
        "mature": ("16+", "Mature 17+"),
        "adult": ("18+", "Adults only 18+"),
    }
    
    # Screenshot size requirements
    SCREENSHOT_SIZES = {
        "microsoft_store": {
            "desktop": {"min": (1280, 720), "max": (3840, 2160)},
            "mobile": {"min": (720, 1280), "max": (2160, 3840)},
            "xbox": {"min": (1920, 1080), "max": (3840, 2160)},
        },
        "google_play": {
            "phone": {"min": (320, 480), "max": (3840, 3840)},
            "tablet": {"min": (1024, 600), "max": (2560, 2560)},
            "feature_graphic": {"exact": (1024, 500)},
        }
    }
    
    def __init__(self, output_dir: str = "./store-listings"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_microsoft_store_listing(self, metadata: AppMetadata) -> MicrosoftStoreListing:
        """Generate Microsoft Store listing from metadata"""
        
        # Map categories
        ms_category, _ = self.CATEGORY_MAPPINGS.get(
            metadata.category.lower(), ("Utilities", "TOOLS")
        )
        
        # Map age rating
        ms_age_rating, _ = self.AGE_RATING_MAPPINGS.get(
            metadata.age_rating.lower(), ("3+", "Everyone")
        )
        
        # Generate screenshots structure
        screenshots = []
        for i, path in enumerate(metadata.screenshots[:9]):  # MS allows up to 9
            screenshots.append({
                "url": path,
                "description": f"Screenshot {i + 1}",
                "type": "desktop" if i < 5 else "mobile"
            })
        
        # Generate features list
        features = metadata.features[:20] if metadata.features else [
            "Easy to use interface",
            "Fast and responsive",
            "Secure and private",
        ]
        
        # Pricing configuration
        pricing = {
            "type": "Free" if metadata.price.lower() == "free" else "Paid",
            "price": metadata.price if metadata.price.lower() != "free" else "0.00",
            "currency": "USD",
            "has_in_app_purchases": metadata.has_in_app_purchases,
            "free_trial": False,
        }
        
        return MicrosoftStoreListing(
            app_name=metadata.name,
            package_family_name=f"{metadata.package_name}_8wekyb3d8bbwe",
            version=metadata.version,
            description=metadata.description,
            short_description=metadata.short_description[:200] if metadata.short_description else "",
            keywords=metadata.keywords[:7] if metadata.keywords else [],
            category=ms_category,
            age_rating=ms_age_rating,
            pricing=pricing,
            features=features,
            screenshots=screenshots,
            store_logo={
                "url": metadata.icons.get("store_logo", ""),
                "size": "50x50"
            },
            promotional_images={
                "hero": metadata.icons.get("hero", ""),
                "wide": metadata.icons.get("wide", ""),
            },
            release_notes=metadata.whats_new or f"Version {metadata.version} release",
            privacy_url=metadata.privacy_url or "",
            website_url=metadata.website or "",
            support_email=metadata.email or ""
        )
    
    def generate_google_play_listing(self, metadata: AppMetadata) -> GooglePlayListing:
        """Generate Google Play Store listing from metadata"""
        
        # Map categories
        _, gp_category = self.CATEGORY_MAPPINGS.get(
            metadata.category.lower(), ("Utilities", "TOOLS")
        )
        
        # Map age rating
        _, gp_age_rating = self.AGE_RATING_MAPPINGS.get(
            metadata.age_rating.lower(), ("3+", "Everyone")
        )
        
        # Generate screenshots structure
        screenshots = {
            "phone": metadata.screenshots[:8],  # Up to 8 phone screenshots
            "tablet": metadata.screenshots[8:16] if len(metadata.screenshots) > 8 else [],
        }
        
        return GooglePlayListing(
            app_name=metadata.name,
            package_name=metadata.package_name,
            version=metadata.version,
            full_description=metadata.description[:4000],  # GP limit
            short_description=metadata.short_description[:80],  # GP limit
            title=metadata.name[:30],  # GP title limit
            category=gp_category,
            content_rating=gp_age_rating,
            pricing=metadata.price,
            screenshots=screenshots,
            feature_graphic=metadata.icons.get("feature_graphic", ""),
            promo_video=metadata.promo_video,
            release_notes=metadata.whats_new or f"Version {metadata.version} release",
            privacy_policy_url=metadata.privacy_url or "",
            website_url=metadata.website or "",
            email=metadata.email or ""
        )
    
    def generate_fastlane_metadata(self, metadata: AppMetadata) -> Dict[str, str]:
        """Generate Fastlane metadata for Google Play"""
        return {
            "title": metadata.name[:30],
            "short_description": metadata.short_description[:80],
            "full_description": metadata.description[:4000],
            "release_notes": metadata.whats_new or f"Version {metadata.version} improvements and bug fixes",
        }
    
    def save_listing(self, listing, platform: str, format: str = "json") -> Path:
        """Save listing to file"""
        from dataclasses import asdict
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{platform}-listing-{timestamp}.{format}"
        filepath = self.output_dir / filename
        
        if format == "json":
            with open(filepath, "w") as f:
                json.dump(asdict(listing), f, indent=2)
        else:
            with open(filepath, "w") as f:
                for key, value in asdict(listing).items():
                    f.write(f"# {key}\n{value}\n\n")
        
        return filepath
    
    def generate_all_listings(self, metadata: AppMetadata) -> Dict[str, Path]:
        """Generate all store listings and save them"""
        results = {}
        
        # Microsoft Store
        ms_listing = self.generate_microsoft_store_listing(metadata)
        results["microsoft_store"] = self.save_listing(ms_listing, "microsoft-store")
        
        # Google Play
        gp_listing = self.generate_google_play_listing(metadata)
        results["google_play"] = self.save_listing(gp_listing, "google-play")
        
        # Fastlane metadata
        fastlane = self.generate_fastlane_metadata(metadata)
        fastlane_path = self.output_dir / "fastlane" / "metadata" / "android" / "en-US"
        fastlane_path.mkdir(parents=True, exist_ok=True)
        
        for key, value in fastlane.items():
            with open(fastlane_path / key, "w") as f:
                f.write(value)
        
        results["fastlane"] = fastlane_path
        
        return results


def main():
    """Example usage"""
    # Create sample metadata
    metadata = AppMetadata(
        name="AI Assistant Pro",
        package_name="com.example.aiassistant",
        version="1.0.0",
        description="""AI Assistant Pro is your intelligent coding companion. 
        Powered by advanced AI models, it helps you write, debug, and optimize code faster than ever.
        
        Features:
        - Multi-model AI support (GPT-4, Claude, Gemini)
        - Code completion and generation
        - Bug detection and fixes
        - Documentation generation
        - Multi-language support
        """,
        short_description="Your intelligent AI coding companion",
        category="developer",
        keywords=["ai", "coding", "assistant", "development", "programming"],
        screenshots=["screenshot1.png", "screenshot2.png"],
        icons={"store_logo": "logo.png", "feature_graphic": "feature.png"},
        features=[
            "Multi-model AI support",
            "Real-time code completion",
            "Bug detection and fixes",
            "Documentation generation",
        ],
        website="https://example.com",
        email="support@example.com",
        privacy_url="https://example.com/privacy",
    )
    
    generator = StoreListingGenerator()
    results = generator.generate_all_listings(metadata)
    
    print("Generated listings:")
    for platform, path in results.items():
        print(f"  {platform}: {path}")


if __name__ == "__main__":
    main()