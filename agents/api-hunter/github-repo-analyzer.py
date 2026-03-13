#!/usr/bin/env python3
"""
GitHub Repository Analyzer - Analyzes repos for API relevance
Integrates with the API Discovery Agent for context-aware API recommendations
"""

import os
import re
import json
import asyncio
import aiohttp
from dataclasses import dataclass, asdict, field
from typing import Optional, List, Dict
from datetime import datetime
from pathlib import Path


@dataclass
class RepoAnalysis:
    """Comprehensive repository analysis"""
    owner: str
    repo: str
    full_name: str
    description: str
    stars: int
    language: str
    topics: List[str] = field(default_factory=list)
    languages: Dict[str, int] = field(default_factory=dict)
    frameworks: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    api_keywords: List[str] = field(default_factory=list)
    suggested_api_categories: List[str] = field(default_factory=list)
    integration_opportunities: List[Dict] = field(default_factory=list)
    readme_analysis: Dict = field(default_factory=dict)


class GitHubRepoAnalyzer:
    """Analyzes GitHub repositories for API integration opportunities"""
    
    # Framework detection patterns
    FRAMEWORK_PATTERNS = {
        # JavaScript/TypeScript
        "react": ["package.json", "react"],
        "vue": ["package.json", "vue"],
        "angular": ["package.json", "@angular"],
        "next.js": ["package.json", "next"],
        "nuxt": ["package.json", "nuxt"],
        "svelte": ["package.json", "svelte"],
        "express": ["package.json", "express"],
        "fastify": ["package.json", "fastify"],
        "nestjs": ["package.json", "@nestjs"],
        
        # Python
        "django": ["requirements.txt", "django", "settings.py"],
        "flask": ["requirements.txt", "flask"],
        "fastapi": ["requirements.txt", "fastapi"],
        "streamlit": ["requirements.txt", "streamlit"],
        "gradio": ["requirements.txt", "gradio"],
        
        # Java
        "spring": ["pom.xml", "spring", "build.gradle"],
        "quarkus": ["pom.xml", "quarkus"],
        
        # C#/.NET
        "dotnet": [".csproj", ".NET"],
        "blazor": [".csproj", "Blazor"],
        
        # Go
        "gin": ["go.mod", "gin-gonic"],
        "echo": ["go.mod", "labstack/echo"],
        
        # Rust
        "actix": ["Cargo.toml", "actix"],
        "rocket": ["Cargo.toml", "rocket"],
    }
    
    # API integration keywords
    API_KEYWORDS = {
        "rest_api": ["rest", "api", "endpoint", "http", "json"],
        "graphql": ["graphql", "gql", "apollo", "query"],
        "webhooks": ["webhook", "callback", "event"],
        "authentication": ["auth", "oauth", "jwt", "token", "login"],
        "payments": ["payment", "stripe", "paypal", "billing", "subscription"],
        "ai_ml": ["ai", "ml", "gpt", "llm", "machine learning", "neural"],
        "database": ["database", "sql", "nosql", "postgres", "mongodb"],
        "storage": ["storage", "s3", "bucket", "file upload"],
        "email": ["email", "smtp", "sendgrid", "mailgun"],
        "sms": ["sms", "twilio", "message", "notification"],
        "analytics": ["analytics", "tracking", "metrics", "dashboard"],
        "maps": ["map", "location", "geocode", "maps"],
        "social": ["social", "twitter", "facebook", "linkedin", "share"],
        "media": ["image", "video", "audio", "media", "cdn"],
        "automation": ["automation", "workflow", "cron", "scheduler"],
        "scraping": ["scrape", "crawl", "spider", "parser"],
        "monitoring": ["monitor", "logging", "observability", "alert"],
    }
    
    # Tech stack to API category mapping
    TECH_TO_API_CATEGORIES = {
        # Languages
        "python": ["data", "ai", "machine-learning", "automation", "web-scraping"],
        "javascript": ["web", "frontend", "social", "media", "analytics"],
        "typescript": ["web", "api", "saas", "productivity"],
        "java": ["enterprise", "payment", "fintech", "cloud"],
        "c#": ["microsoft", "enterprise", "azure", "office"],
        "go": ["cloud", "devops", "infrastructure", "containers"],
        "rust": ["systems", "web3", "blockchain", "performance"],
        "swift": ["apple", "ios", "maps", "media"],
        "kotlin": ["android", "mobile", "google", "payments"],
        "dart": ["flutter", "mobile", "cross-platform"],
        "ruby": ["web", "ecommerce", "automation"],
        "php": ["web", "cms", "ecommerce"],
        
        # Frameworks
        "react": ["ui", "frontend", "social", "analytics"],
        "vue": ["ui", "frontend", "web"],
        "angular": ["enterprise", "frontend", "google"],
        "next.js": ["web", "seo", "analytics", "cms", "vercel"],
        "express": ["backend", "api", "database", "auth"],
        "django": ["backend", "admin", "api", "auth"],
        "fastapi": ["api", "async", "ml", "web"],
        "spring": ["enterprise", "microservices", "security"],
        "flutter": ["mobile", "payments", "push-notifications"],
    }
    
    def __init__(self, github_token: str = None, output_dir: str = "./repo-analysis-output"):
        self.github_token = github_token or os.getenv("GITHUB_TOKEN")
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.session = None
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub-Repo-Analyzer/1.0"
        }
        if self.github_token:
            self.headers["Authorization"] = f"token {self.github_token}"
    
    async def init_session(self):
        """Initialize aiohttp session"""
        if self.session is None:
            self.session = aiohttp.ClientSession(headers=self.headers)
    
    async def close_session(self):
        """Close aiohttp session"""
        if self.session:
            await self.session.close()
            self.session = None
    
    async def fetch_json(self, url: str) -> Optional[dict]:
        """Fetch JSON from URL"""
        await self.init_session()
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                print(f"Failed to fetch {url}: {response.status}")
        except Exception as e:
            print(f"Error fetching {url}: {e}")
        return None
    
    async def get_repo_info(self, owner: str, repo: str) -> Optional[dict]:
        """Get basic repository information"""
        url = f"https://api.github.com/repos/{owner}/{repo}"
        return await self.fetch_json(url)
    
    async def get_repo_languages(self, owner: str, repo: str) -> Dict[str, int]:
        """Get repository languages"""
        url = f"https://api.github.com/repos/{owner}/{repo}/languages"
        data = await self.fetch_json(url)
        return data if data else {}
    
    async def get_repo_readme(self, owner: str, repo: str) -> Optional[str]:
        """Get repository README content"""
        url = f"https://api.github.com/repos/{owner}/{repo}/readme"
        data = await self.fetch_json(url)
        if data and "content" in data:
            import base64
            return base64.b64decode(data["content"]).decode("utf-8")
        return None
    
    async def get_package_json(self, owner: str, repo: str) -> Optional[dict]:
        """Get package.json for JS projects"""
        url = f"https://api.github.com/repos/{owner}/{repo}/contents/package.json"
        data = await self.fetch_json(url)
        if data and "content" in data:
            import base64
            try:
                content = base64.b64decode(data["content"]).decode("utf-8")
                return json.loads(content)
            except:
                pass
        return None
    
    async def get_requirements_txt(self, owner: str, repo: str) -> List[str]:
        """Get requirements.txt for Python projects"""
        url = f"https://api.github.com/repos/{owner}/{repo}/contents/requirements.txt"
        data = await self.fetch_json(url)
        if data and "content" in data:
            import base64
            try:
                content = base64.b64decode(data["content"]).decode("utf-8")
                return [line.strip() for line in content.split("\n") if line.strip() and not line.startswith("#")]
            except:
                pass
        return []
    
    def detect_frameworks(self, repo_data: dict, package_json: dict = None, requirements: List[str] = None) -> List[str]:
        """Detect frameworks used in the repository"""
        frameworks = []
        
        # Check package.json for JS frameworks
        if package_json:
            deps = {**package_json.get("dependencies", {}), **package_json.get("devDependencies", {})}
            for fw, patterns in self.FRAMEWORK_PATTERNS.items():
                if patterns[0] == "package.json" and patterns[1] in deps:
                    frameworks.append(fw)
        
        # Check requirements.txt for Python frameworks
        if requirements:
            for fw, patterns in self.FRAMEWORK_PATTERNS.items():
                if patterns[0] == "requirements.txt":
                    for req in requirements:
                        if patterns[1].lower() in req.lower():
                            frameworks.append(fw)
                            break
        
        # Check topics
        topics = repo_data.get("topics", [])
        for fw in self.FRAMEWORK_PATTERNS.keys():
            if fw.replace(".", "").replace("-", "") in [t.replace("-", "").replace(".", "") for t in topics]:
                if fw not in frameworks:
                    frameworks.append(fw)
        
        return list(set(frameworks))
    
    def extract_api_keywords(self, readme: str, description: str = "") -> List[str]:
        """Extract API-related keywords from README and description"""
        keywords = set()
        combined_text = f"{description}\n{readme}".lower()
        
        for category, patterns in self.API_KEYWORDS.items():
            for pattern in patterns:
                if re.search(rf"\b{pattern}\b", combined_text, re.I):
                    keywords.add(category)
                    break
        
        return list(keywords)
    
    def suggest_api_categories(self, languages: Dict, frameworks: List[str], keywords: List[str]) -> List[str]:
        """Suggest API categories based on analysis"""
        categories = set()
        
        # From languages
        for lang in languages.keys():
            lang_lower = lang.lower()
            if lang_lower in self.TECH_TO_API_CATEGORIES:
                categories.update(self.TECH_TO_API_CATEGORIES[lang_lower])
        
        # From frameworks
        for fw in frameworks:
            fw_lower = fw.lower().replace(".", "")
            if fw_lower in self.TECH_TO_API_CATEGORIES:
                categories.update(self.TECH_TO_API_CATEGORIES[fw_lower])
        
        # From keywords
        for kw in keywords:
            if kw in ["ai_ml"]:
                categories.update(["ai", "machine-learning", "openai", "anthropic"])
            elif kw in ["payments"]:
                categories.update(["payments", "stripe", "billing"])
            elif kw in ["authentication"]:
                categories.update(["auth", "oauth", "identity"])
        
        return list(categories)
    
    def generate_integration_opportunities(self, analysis: RepoAnalysis) -> List[Dict]:
        """Generate specific API integration opportunities"""
        opportunities = []
        
        # AI/ML opportunities
        if "ai_ml" in analysis.api_keywords or "python" in analysis.languages:
            opportunities.extend([
                {"api": "OpenAI", "use_case": "GPT-4 for text generation", "priority": "high"},
                {"api": "Hugging Face", "use_case": "ML model inference", "priority": "medium"},
            ])
        
        # Payment opportunities
        if "payments" in analysis.api_keywords or any(fw in analysis.frameworks for fw in ["next.js", "django", "express"]):
            opportunities.extend([
                {"api": "Stripe", "use_case": "Payment processing", "priority": "high"},
                {"api": "RevenueCat", "use_case": "Subscription management", "priority": "medium"},
            ])
        
        # Mobile app opportunities
        if "flutter" in analysis.frameworks or "kotlin" in analysis.languages or "swift" in analysis.languages:
            opportunities.extend([
                {"api": "Firebase", "use_case": "Auth, database, push notifications", "priority": "high"},
                {"api": "RevenueCat", "use_case": "In-app purchases", "priority": "high"},
            ])
        
        # Web app opportunities
        if any(fw in analysis.frameworks for fw in ["react", "vue", "next.js", "angular"]):
            opportunities.extend([
                {"api": "Vercel", "use_case": "Deployment and hosting", "priority": "high"},
                {"api": "Auth0", "use_case": "Authentication", "priority": "medium"},
                {"api": "Sanity", "use_case": "Headless CMS", "priority": "medium"},
            ])
        
        # Analytics opportunities
        if any(kw in analysis.api_keywords for kw in ["analytics", "monitoring"]):
            opportunities.extend([
                {"api": "Mixpanel", "use_case": "Product analytics", "priority": "high"},
                {"api": "Sentry", "use_case": "Error tracking", "priority": "high"},
            ])
        
        # Remove duplicates while preserving order
        seen = set()
        unique_opportunities = []
        for opp in opportunities:
            key = opp["api"]
            if key not in seen:
                seen.add(key)
                unique_opportunities.append(opp)
        
        return unique_opportunities
    
    async def analyze_repo(self, owner: str, repo: str) -> RepoAnalysis:
        """Perform comprehensive repository analysis"""
        print(f"🔍 Analyzing repository: {owner}/{repo}")
        
        # Fetch all data
        repo_data = await self.get_repo_info(owner, repo)
        if not repo_data:
            raise ValueError(f"Repository {owner}/{repo} not found")
        
        languages = await self.get_repo_languages(owner, repo)
        readme = await self.get_repo_readme(owner, repo) or ""
        package_json = await self.get_package_json(owner, repo)
        requirements = await self.get_requirements_txt(owner, repo)
        
        # Detect frameworks
        frameworks = self.detect_frameworks(repo_data, package_json, requirements)
        
        # Extract API keywords
        api_keywords = self.extract_api_keywords(readme, repo_data.get("description", ""))
        
        # Create analysis object
        analysis = RepoAnalysis(
            owner=owner,
            repo=repo,
            full_name=f"{owner}/{repo}",
            description=repo_data.get("description", ""),
            stars=repo_data.get("stargazers_count", 0),
            language=repo_data.get("language", ""),
            topics=repo_data.get("topics", []),
            languages=languages,
            frameworks=frameworks,
            dependencies=list(package_json.get("dependencies", {}).keys()) if package_json else requirements[:20],
            api_keywords=api_keywords,
            suggested_api_categories=[],
            integration_opportunities=[],
            readme_analysis={"word_count": len(readme.split()), "has_api_docs": "api" in readme.lower()}
        )
        
        # Suggest API categories
        analysis.suggested_api_categories = self.suggest_api_categories(
            languages, frameworks, api_keywords
        )
        
        # Generate integration opportunities
        analysis.integration_opportunities = self.generate_integration_opportunities(analysis)
        
        print(f"✅ Analysis complete for {owner}/{repo}")
        return analysis
    
    def save_analysis(self, analysis: RepoAnalysis, filename: str = None) -> Path:
        """Save analysis to JSON file"""
        if not filename:
            filename = f"repo-analysis-{analysis.owner}-{analysis.repo}.json"
        
        output_path = self.output_dir / filename
        
        with open(output_path, "w") as f:
            json.dump(asdict(analysis), f, indent=2)
        
        print(f"💾 Analysis saved to {output_path}")
        return output_path
    
    def generate_report(self, analysis: RepoAnalysis) -> str:
        """Generate markdown report for analysis"""
        report = []
        report.append(f"# 📊 Repository Analysis: {analysis.full_name}\n\n")
        
        # Overview
        report.append("## Overview\n\n")
        report.append(f"- **Description:** {analysis.description or 'No description'}\n")
        report.append(f"- **Stars:** {analysis.stars:,}\n")
        report.append(f"- **Primary Language:** {analysis.language}\n")
        report.append(f"- **Topics:** {', '.join(analysis.topics) or 'None'}\n\n")
        
        # Tech Stack
        report.append("## 🛠️ Tech Stack\n\n")
        report.append("### Languages\n")
        for lang, bytes_count in sorted(analysis.languages.items(), key=lambda x: x[1], reverse=True)[:5]:
            report.append(f"- {lang}\n")
        
        report.append("\n### Frameworks\n")
        for fw in analysis.frameworks:
            report.append(f"- {fw}\n")
        
        # API Keywords
        report.append("\n## 🔌 API Relevance\n\n")
        report.append("### Detected Keywords\n")
        for kw in analysis.api_keywords:
            report.append(f"- {kw}\n")
        
        report.append("\n### Suggested API Categories\n")
        for cat in analysis.suggested_api_categories[:10]:
            report.append(f"- {cat}\n")
        
        # Integration Opportunities
        report.append("\n## 💡 Integration Opportunities\n\n")
        report.append("| API | Use Case | Priority |\n")
        report.append("|-----|----------|----------|\n")
        for opp in analysis.integration_opportunities:
            report.append(f"| {opp['api']} | {opp['use_case']} | {opp['priority']} |\n")
        
        return "".join(report)


async def main():
    """Main entry point"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python github-repo-analyzer.py <owner/repo>")
        sys.exit(1)
    
    owner, repo = sys.argv[1].split("/")
    
    analyzer = GitHubRepoAnalyzer()
    
    try:
        analysis = await analyzer.analyze_repo(owner, repo)
        
        # Save analysis
        analyzer.save_analysis(analysis)
        
        # Generate and save report
        report = analyzer.generate_report(analysis)
        report_path = analyzer.output_dir / f"report-{owner}-{repo}.md"
        with open(report_path, "w") as f:
            f.write(report)
        
        print(f"\n📄 Report saved to {report_path}")
        
        # Print summary
        print("\n" + "=" * 50)
        print("ANALYSIS SUMMARY:")
        print("=" * 50)
        print(f"Repository: {analysis.full_name}")
        print(f"Language: {analysis.language}")
        print(f"Frameworks: {', '.join(analysis.frameworks) or 'None detected'}")
        print(f"API Keywords: {', '.join(analysis.api_keywords) or 'None'}")
        print(f"Top Integration Opportunities: {len(analysis.integration_opportunities)}")
    
    finally:
        await analyzer.close_session()


if __name__ == "__main__":
    asyncio.run(main())