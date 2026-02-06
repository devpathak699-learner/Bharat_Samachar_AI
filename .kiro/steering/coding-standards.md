# Coding Standards - Bharat Samachar

## General Principles
- Write clean, maintainable, and well-documented code
- Follow language-specific best practices
- Prioritize performance and scalability
- Security-first approach (JWT auth, TLS encryption, data privacy)

## Python (Backend)
- **Style**: Follow PEP 8
- **Type hints**: Use type annotations for all functions
- **Async**: Use async/await for I/O operations
- **Error handling**: Use try-except with specific exceptions
- **Docstrings**: Google-style docstrings for all public functions
- **Testing**: pytest with 80%+ code coverage target

### Example
```python
async def translate_with_context(
    article_id: str,
    target_language: str
) -> dict[str, Any]:
    """Translate article with cultural context adaptation.
    
    Args:
        article_id: Unique identifier for the article
        target_language: ISO 639-1 language code (e.g., 'hi', 'ta')
    
    Returns:
        Dictionary containing translated content and metadata
    
    Raises:
        TranslationError: If translation fails
    """
    pass
```

## TypeScript/React (Frontend)
- **Style**: Use ESLint + Prettier
- **Components**: Functional components with hooks
- **Types**: Strict TypeScript, no `any` types
- **State**: Use React hooks (useState, useEffect) or Zustand for global state
- **Naming**: PascalCase for components, camelCase for functions/variables

### Example
```typescript
interface TranslationResult {
  articleId: string;
  targetLanguage: string;
  translatedContent: string;
  culturalAdaptations: string[];
}

const TranslationCard: React.FC<{ result: TranslationResult }> = ({ result }) => {
  // Component implementation
};
```

## API Design
- **REST**: Follow RESTful conventions
- **Versioning**: Use `/api/v1/` prefix
- **Response format**: Consistent JSON structure
```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2026-02-06T22:30:00Z"
}
```

## Database
- **Naming**: snake_case for tables and columns
- **Indexes**: Add indexes for frequently queried columns
- **Migrations**: Use Alembic for schema changes
- **Normalization**: Follow 3NF, denormalize only when necessary for performance

## Security Requirements
- **Authentication**: JWT tokens (15-min access + 7-day refresh)
- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Data residency**: Store all data in AWS Mumbai region
- **API security**: Rate limiting (10/hr free, 100/hr paid)
- **Input validation**: Sanitize all user inputs
- **Secrets**: Use environment variables, never commit secrets

## Performance
- **Caching**: Use Redis aggressively (60% cost savings target)
- **Async tasks**: Use Celery for long-running operations
- **Database**: Use connection pooling, optimize queries
- **CDN**: Serve static assets via CloudFront

## Cost Optimization
- Cache AI API responses (24hr TTL)
- Batch requests when possible
- Use spot instances for video workers
- Target: ₹50-75 per article processing cost

## Git Workflow
- **Branches**: `main` (production), `develop` (staging), `feature/*` (new features)
- **Commits**: Conventional commits format
  - `feat:` new feature
  - `fix:` bug fix
  - `docs:` documentation
  - `refactor:` code refactoring
  - `test:` adding tests
- **PRs**: Require code review before merging

## Documentation
- Keep README.md, requirements.md, and design.md updated
- Document all API endpoints
- Add inline comments for complex logic
- Update CHANGELOG.md for releases
