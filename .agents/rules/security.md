---
trigger: always_on
---

# Security Rule

Even without auth:

- Validate imported files
- Check MIME types
- No eval usage
- No dynamic script injection
- No unsafe window exposure
- Limit file size
- Handle corrupted MIDI safely

Prepare codebase for future auth integration.