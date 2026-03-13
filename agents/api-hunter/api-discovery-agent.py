#!/usr/bin/env python3
"""
API Discovery Agent - Hunts for useful APIs relevant to GitHub repositories

Features:
- Scrapes multiple API directories (RapidAPI, APYHub, PublicAPIs.dev, etc.)
- Analyzes GitHub repositories for relevant API needs
- Matches APIs to repository tech stack and requirements
- Outputs structured API recommendations
"""

import os
import json
import re
import asyncio
import aiohttp
from dataclasses import dataclass, asdict
from typing import Optional
from datetime import datetime
from pathlib import Path


@dataclass
class API:
    """Represents a discovered API"""
    name: str
    description: str
    category: str
    base_url: str
    auth_type: str  # api_key, oauth, none, etc.
    pricing: str  # free, freemium, paid
    source: str  # where we found it
    relevance_score: float = 0.0
    documentation_url: Optional[str] = None
    popularity: Optional[int] = None  # users/calls count if available
    tags: list = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []


@dataclass
class RepoAnalysis:
    """Analysis of a GitHub repository for API needs"""
    repo_name: str
    languages: list
    frameworks: list
    dependencies: list
    topics: list
    readme_keywords: list
    suggested_api_categories: list


class APIDiscoveryAgent:
    """Main agent class for API discovery"""
    
    # API Directory Sources
    API_SOURCES = {
        "rapidapi": {
            "url": "https://rapidapi.com/hub",
            "categories_url": "https://rapidapi.com/categories"
        },
        "publicapis": {
            "url": "https://api.publicapis.org/entries",
            "random": "https://api.publicapis.org/random"
        },
        "apyhub": {
            "url": "https://apyhub.com/catalog",
            "search": "https://apyhub.com/api/search?q={query}"
        },
        "apisdev": {
            "url": "https://publicapis.dev/api/apis",
            "categories": "https://publicapis.dev/api/categories"
        },
        "github_trending": {
            "url": "https://api.github.com/search/repositories?q=api+language:python&sort=stars&order=desc"
        }
    }
    
    # Tech stack to API category mapping
    TECH_API_MAPPING = {
        # Languages
        "python": ["data", "ai", "machine-learning", "web-scraping", "automation"],
        "javascript": ["web", "frontend", "social", "media", "analytics"],
        "typescript": ["web", "api", "saas", "productivity"],
        "java": ["enterprise", "payment", "fintech", "cloud"],
        "csharp": ["microsoft", "enterprise", "azure", "office"],
        "go": ["cloud", "devops", "infrastructure", "containers"],
        "rust": ["systems", "web3", "blockchain", "performance"],
        "swift": ["apple", "ios", "maps", "media"],
        "kotlin": ["android", "mobile", "google", "payments"],
        
        # Frameworks
        "react": ["ui", "frontend", "social", "analytics"],
        "vue": ["ui", "frontend", "web"],
        "angular": ["enterprise", "frontend", "google"],
        "next.js": ["web", "seo", "analytics", "cms"],
        "express": ["backend", "api", "database", "auth"],
        "django": ["backend", "admin", "api", "auth"],
        "flask": ["api", "web", "microservices"],
        "fastapi": ["api", "async", "ml", "web"],
        "spring": ["enterprise", "microservices", "security"],
        "dotnet": ["enterprise", "azure", "microsoft"],
        
        # Use cases
        "mobile": ["push-notifications", "analytics", "auth", "payments", "maps"],
        "web": ["seo", "analytics", "cdn", "auth", "email"],
        "api": ["gateway", "documentation", "monitoring", "testing"],
        "ai": ["openai", "anthropic", "huggingface", "replicate"],
        "data": ["database", "etl", "visualization", "storage"],
        "ecommerce": ["payments", "shipping", "inventory", "products"],
        "saas": ["billing", "subscriptions", "email", "analytics"],
    }
    
    def __init__(self, output_dir: str = "./api-discovery-output"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.session = None
        self.discovered_apis = []
        
    async def init_session(self):
        """Initialize aiohttp session"""
        if self.session is None:
            self.session = aiohttp.ClientSession(
                headers={
                    "User-Agent": "API-Discovery-Agent/1.0",
                    "Accept": "application/json"
                }
            )
    
    async def close_session(self):
        """Close aiohttp session"""
        if self.session:
            await self.session.close()
            self.session = None
    
    async def fetch_json(self, url: str, params: dict = None) -> Optional[dict]:
        """Fetch JSON from URL with error handling"""
        await self.init_session()
        try:
            async with self.session.get(url, params=params, timeout=30) as response:
                if response.status == 200:
                    return await response.json()
                print(f"Failed to fetch {url}: Status {response.status}")
        except Exception as e:
            print(f"Error fetching {url}: {e}")
        return None
    
    async def fetch_html(self, url: str) -> Optional[str]:
        """Fetch HTML content from URL"""
        await self.init_session()
        try:
            async with self.session.get(url, timeout=30) as response:
                if response.status == 200:
                    return await response.text()
        except Exception as e:
            print(f"Error fetching HTML {url}: {e}")
        return None
    
    async def discover_from_publicapis(self) -> list:
        """Discover APIs from publicapis.org"""
        print("🔍 Discovering APIs from publicapis.org...")
        apis = []
        
        data = await self.fetch_json(self.API_SOURCES["publicapis"]["url"])
        if data and "entries" in data:
            for entry in data["entries"][:100]:  # Limit to 100 for performance
                api = API(
                    name=entry.get("API", "Unknown"),
                    description=entry.get("Description", ""),
                    category=entry.get("Category", "general"),
                    base_url=entry.get("Link", ""),
                    auth_type=entry.get("Auth", "none") or "none",
                    pricing="free" if entry.get("HTTPS") else "unknown",
                    source="publicapis.org"
                )
                apis.append(api)
        
        print(f"  Found {len(apis)} APIs from publicapis.org")
        return apis
    
    async def discover_from_publicapis_dev(self) -> list:
        """Discover APIs from publicapis.dev"""
        print("🔍 Discovering APIs from publicapis.dev...")
        apis = []
        
        data = await self.fetch_json(self.API_SOURCES["apisdev"]["url"])
        if data:
            for entry in data.get("data", [])[:100]:
                api = API(
                    name=entry.get("name", "Unknown"),
                    description=entry.get("description", ""),
                    category=entry.get("category", "general"),
                    base_url=entry.get("base_url", ""),
                    auth_type="api_key" if entry.get("api_key_required") else "none",
                    pricing=entry.get("pricing", "unknown"),
                    source="publicapis.dev",
                    tags=entry.get("tags", [])
                )
                apis.append(api)
        
        print(f"  Found {len(apis)} APIs from publicapis.dev")
        return apis
    
    async def discover_ai_apis(self) -> list:
        """Discover AI/ML APIs from various sources"""
        print("🔍 Discovering AI/ML APIs...")
        apis = []
        
        # Known AI APIs
        ai_apis = [
            API(
                name="OpenAI API",
                description="GPT-4, DALL-E, Whisper, and more AI models",
                category="ai",
                base_url="https://api.openai.com/v1",
                auth_type="api_key",
                pricing="freemium",
                source="manual",
                documentation_url="https://platform.openai.com/docs",
                tags=["ai", "gpt", "chatgpt", "dall-e", "whisper"]
            ),
            API(
                name="Anthropic Claude API",
                description="Claude AI assistant API",
                category="ai",
                base_url="https://api.anthropic.com/v1",
                auth_type="api_key",
                pricing="paid",
                source="manual",
                documentation_url="https://docs.anthropic.com",
                tags=["ai", "claude", "llm"]
            ),
            API(
                name="Hugging Face Inference API",
                description="Access 100K+ ML models",
                category="ai",
                base_url="https://api-inference.huggingface.co/models",
                auth_type="api_key",
                pricing="freemium",
                source="manual",
                documentation_url="https://huggingface.co/docs/api-inference",
                tags=["ai", "ml", "transformers", "models"]
            ),
            API(
                name="Replicate API",
                description="Run open-source ML models",
                category="ai",
                base_url="https://api.replicate.com/v1",
                auth_type="api_key",
                pricing="pay-per-use",
                source="manual",
                documentation_url="https://replicate.com/docs",
                tags=["ai", "ml", "stable-diffusion", "llm"]
            ),
            API(
                name="Google Gemini API",
                description="Google's generative AI models",
                category="ai",
                base_url="https://generativelanguage.googleapis.com/v1",
                auth_type="api_key",
                pricing="freemium",
                source="manual",
                documentation_url="https://ai.google.dev/docs",
                tags=["ai", "gemini", "google", "llm"]
            ),
            API(
                name="Groq API",
                description="Fast LLM inference with LLaMA models",
                category="ai",
                base_url="https://api.groq.com/openai/v1",
                auth_type="api_key",
                pricing="freemium",
                source="manual",
                documentation_url="https://console.groq.com/docs",
                tags=["ai", "llm", "fast", "llama"]
            ),
            API(
                name="OpenRouter API",
                description="Unified API for multiple LLM providers",
                category="ai",
                base_url="https://openrouter.ai/api/v1",
                auth_type="api_key",
                pricing="pay-per-use",
                source="manual",
                documentation_url="https://openrouter.ai/docs",
                tags=["ai", "llm", "gateway", "multi-provider"]
            ),
        ]
        apis.extend(ai_apis)
        
        print(f"  Found {len(apis)} AI/ML APIs")
        return apis
    
    async def discover_devops_apis(self) -> list:
        """Discover DevOps and cloud APIs"""
        print("🔍 Discovering DevOps/Cloud APIs...")
        apis = [
            API(
                name="GitHub API",
                description="GitHub REST API for repositories, issues, PRs",
                category="devops",
                base_url="https://api.github.com",
                auth_type="oauth",
                pricing="free",
                source="manual",
                documentation_url="https://docs.github.com/rest",
                tags=["github", "git", "ci-cd", "repositories"]
            ),
            API(
                name="Docker Hub API",
                description="Docker container registry API",
                category="devops",
                base_url="https://hub.docker.com/v2",
                auth_type="api_key",
                pricing="free",
                source="manual",
                documentation_url="https://docs.docker.com/docker-hub/api/latest",
                tags=["docker", "containers", "registry"]
            ),
            API(
                name="Vercel API",
                description="Vercel deployment and hosting API",
                category="devops",
                base_url="https://api.vercel.com",
                auth_type="api_key",
                pricing="freemium",
                source="manual",
                documentation_url="https://vercel.com/docs/rest-api",
                tags=["vercel", "deployment", "hosting", "edge"]
            ),
            API(
                name="Netlify API",
                description="Netlify deployment API",
                category="devops",
                base_url="https://api.netlify.com/api/v1",
                auth_type="oauth",
                pricing="freemium",
                source="manual",
                documentation_url="https://open-api.netlify.com",
                tags=["netlify", "deployment", "hosting", "jamstack"]
            ),
            API(
                name="DigitalOcean API",
                description="Cloud infrastructure API",
                category="cloud",
                base_url="https://api.digitalocean.com/v2",
                auth_type="api_key",
                pricing="pay-per-use",
                source="manual",
                documentation_url="https://docs.digitalocean.com/reference/api",
                tags=["digitalocean", "vps", "droplets", "kubernetes"]
            ),
        ]
        print(f"  Found {len(apis)} DevOps/Cloud APIs")
        return apis
    
    async def discover_payment_apis(self) -> list:
        """Discover payment and fintech APIs"""
        print("🔍 Discovering Payment/Fintech APIs...")
        apis = [
            API(
                name="Stripe API",
                description="Payment processing platform",
                category="payments",
                base_url="https://api.stripe.com/v1",
                auth_type="api_key",
                pricing="pay-per-use",
                source="manual",
                documentation_url="https://stripe.com/docs/api",
                tags=["stripe", "payments", "subscriptions", "billing"]
            ),
            API(
                name="PayPal API",
                description="PayPal payments API",
                category="payments",
                base_url="https://api-m.paypal.com",
                auth_type="oauth",
                pricing="pay-per-use",
                source="manual",
                documentation_url="https://developer.paypal.com/api/rest",
                tags=["paypal", "payments"]
            ),
            API(
                name="RevenueCat API",
                description="Subscription management for mobile apps",
                category="payments",
                base_url="https://api.revenuecat.com/v1",
                auth_type="api_key",
                pricing="freemium",
                source="manual",
                documentation_url="https://docs.revenuecat.com",
                tags=["revenuecat", "subscriptions", "mobile", "iap"]
            ),
        ]
        print(f"  Found {len(apis)} Payment APIs")
        return apis
    
    def analyze_github_repo(self, repo_data: dict) -> RepoAnalysis:
        """Analyze a GitHub repository to determine API needs"""
        languages = list(repo_data.get("languages", {}).keys())
        
        # Extract frameworks from topics and description
        topics = repo_data.get("topics", [])
        description = repo_data.get("description", "") or ""
        
        frameworks = []
        dependencies = []
        
        # Common framework patterns
        framework_patterns = {
            "react": r"\breact\b",
            "vue": r"\bvue\b",
            "angular": r"\bangular\b",
            "next": r"\bnextjs?\b",
            "express": r"\bexpress\b",
            "django": r"\bdjango\b",
            "flask": r"\bflask\b",
            "fastapi": r"\bfastapi\b",
            "spring": r"\bspring\b",
            "dotnet": r"\b\.net\b",
        }
        
        for fw, pattern in framework_patterns.items():
            if re.search(pattern, description, re.I) or fw in topics:
                frameworks.append(fw)
        
        # Extract keywords from README
        readme_keywords = []
        if repo_data.get("readme"):
            readme = repo_data["readme"].lower()
            keyword_patterns = [
                r"api", r"rest", r"graphql", r"webhook", r"integration",
                r"automation", r"scraping", r"ai", r"ml", r"payment",
                r"auth", r"email", r"storage", r"database", r"analytics"
            ]
            for kw in keyword_patterns:
                if re.search(rf"\b{kw}\b", readme):
                    readme_keywords.append(kw)
        
        # Determine suggested API categories
        suggested_categories = set()
        for lang in languages:
            lang_lower = lang.lower()
            if lang_lower in self.TECH_API_MAPPING:
                suggested_categories.update(self.TECH_API_MAPPING[lang_lower])
        for fw in frameworks:
            fw_lower = fw.lower()
            if fw_lower in self.TECH_API_MAPPING:
                suggested_categories.update(self.TECH_API_MAPPING[fw_lower])
        
        return RepoAnalysis(
            repo_name=repo_data.get("full_name", "unknown"),
            languages=languages,
            frameworks=frameworks,
            dependencies=dependencies,
            topics=topics,
            readme_keywords=readme_keywords,
            suggested_api_categories=list(suggested_categories)
        )
    
    def calculate_relevance(self, api: API, repo_analysis: RepoAnalysis) -> float:
        """Calculate relevance score of an API to a repository"""
        score = 0.0
        
        # Category matching
        if api.category in repo_analysis.suggested_api_categories:
            score += 3.0
        
        # Tag matching
        for tag in (api.tags or []):
            if tag in repo_analysis.topics or tag in repo_analysis.readme_keywords:
                score += 1.0
        
        # Language/framework specific matching
        if api.category == "ai" and ("ai" in repo_analysis.readme_keywords or "ml" in repo_analysis.readme_keywords):
            score += 2.0
        
        # Pricing preference (free/freemium preferred)
        if api.pricing == "free":
            score += 0.5
        elif api.pricing == "freemium":
            score += 0.3
        
        return round(score, 2)
    
    async def run_full_discovery(self, repo_analysis: Optional[RepoAnalysis] = None) -> list:
        """Run full API discovery across all sources"""
        print("🚀 Starting API Discovery Agent...")
        print("=" * 50)
        
        all_apis = []
        
        # Discover from all sources concurrently
        tasks = [
            self.discover_from_publicapis(),
            self.discover_from_publicapis_dev(),
            self.discover_ai_apis(),
            self.discover_devops_apis(),
            self.discover_payment_apis(),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, list):
                all_apis.extend(result)
            elif isinstance(result, Exception):
                print(f"Error in discovery: {result}")
        
        # Calculate relevance if repo analysis provided
        if repo_analysis:
            print(f"\n📊 Calculating relevance for {repo_analysis.repo_name}...")
            for api in all_apis:
                api.relevance_score = self.calculate_relevance(api, repo_analysis)
            
            # Sort by relevance
            all_apis.sort(key=lambda x: x.relevance_score, reverse=True)
        
        self.discovered_apis = all_apis
        print(f"\n✅ Discovered {len(all_apis)} total APIs")
        return all_apis
    
    def save_results(self, filename: str = None):
        """Save discovered APIs to JSON file"""
        if not filename:
            filename = f"api-discovery-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        output_path = self.output_dir / filename
        
        data = {
            "discovered_at": datetime.now().isoformat(),
            "total_apis": len(self.discovered_apis),
            "apis": [asdict(api) for api in self.discovered_apis]
        }
        
        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)
        
        print(f"💾 Results saved to {output_path}")
        return output_path
    
    def generate_markdown_report(self, top_n: int = 20) -> str:
        """Generate a markdown report of top APIs"""
        report = []
        report.append("# 🔍 API Discovery Report\n")
        report.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        report.append(f"**Total APIs Discovered:** {len(self.discovered_apis)}\n\n")
        
        # Group by category
        categories = {}
        for api in self.discovered_apis:
            cat = api.category
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(api)
        
        # Top APIs by relevance
        report.append("## 🏆 Top APIs by Relevance\n\n")
        top_apis = sorted(self.discovered_apis, key=lambda x: x.relevance_score, reverse=True)[:top_n]
        for api in top_apis:
            report.append(f"### {api.name}\n")
            report.append(f"- **Category:** {api.category}\n")
            report.append(f"- **Description:** {api.description}\n")
            report.append(f"- **Pricing:** {api.pricing}\n")
            report.append(f"- **Auth:** {api.auth_type}\n")
            report.append(f"- **Relevance:** {api.relevance_score}\n")
            if api.documentation_url:
                report.append(f"- **Docs:** [{api.documentation_url}]({api.documentation_url})\n")
            report.append("\n")
        
        # APIs by category
        report.append("## 📂 APIs by Category\n\n")
        for category, apis in sorted(categories.items()):
            report.append(f"### {category.title()}\n\n")
            for api in apis[:10]:  # Top 10 per category
                report.append(f"- **{api.name}** - {api.description[:100]}...\n")
            report.append("\n")
        
        return "".join(report)


async def main():
    """Main entry point"""
    agent = APIDiscoveryAgent()
    
    try:
        # Run discovery
        apis = await agent.run_full_discovery()
        
        # Save results
        agent.save_results()
        
        # Generate report
        report = agent.generate_markdown_report()
        report_path = agent.output_dir / "api-discovery-report.md"
        with open(report_path, "w") as f:
            f.write(report)
        
        print(f"\n📄 Markdown report saved to {report_path}")
        
        # Print top 10
        print("\n" + "=" * 50)
        print("TOP 10 DISCOVERED APIs:")
        print("=" * 50)
        for i, api in enumerate(apis[:10], 1):
            print(f"{i}. {api.name} ({api.category}) - {api.pricing}")
    
    finally:
        await agent.close_session()


if __name__ == "__main__":
    asyncio.run(main())