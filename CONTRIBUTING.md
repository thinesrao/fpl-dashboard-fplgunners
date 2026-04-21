# 🤝 Contributing to FPL Dashboard

Thank you for your interest in contributing to the FPL Dashboard! This document provides guidelines for contributing to this project.

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Git
- A GitHub account
- Basic knowledge of Python and Streamlit

### Development Setup
1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/fpl-dashboard-streamlit.git
   cd fpl-dashboard-streamlit
   ```

3. **Set up development environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Create your config**:
   ```bash
   cp config_template.py config.py
   # Edit config.py with your test league data
   ```

## 🛠️ Development Guidelines

### Code Style
- Follow PEP 8 Python style guidelines
- Use meaningful variable and function names
- Add docstrings to functions and classes
- Keep functions focused and small

### Security Guidelines
- **NEVER** commit private data (league IDs, API keys, credentials)
- Use the configuration system for all user-specific data
- Test with generic/example data only
- Ensure all sensitive files are in `.gitignore`

### Testing
- Test your changes with different league configurations
- Verify the dashboard works with various data scenarios
- Test both local and deployment scenarios
- Ensure no private data is exposed

## 📝 Making Changes

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes
- Write clean, documented code
- Follow existing patterns
- Add error handling
- Update documentation if needed

### 3. Test Your Changes
```bash
# Test the dashboard
streamlit run app.py

# Test the data pipeline
python data_pipeline.py
```

### 4. Commit Your Changes
```bash
git add .
git commit -m "feat: add new award calculation"
```

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```

## 🏷️ Issue Types

### 🐛 Bug Reports
- Use the bug report template
- Include steps to reproduce
- Provide environment details
- Add error logs if available

### ✨ Feature Requests
- Use the feature request template
- Describe the problem and proposed solution
- Consider the impact on existing users
- Provide mockups or examples if possible

### 🛠️ Setup Help
- Use the setup help template
- Include your configuration details
- Describe what you've tried
- Provide error messages

## 📊 Award System Contributions

### Adding New Awards
1. **Update `data_pipeline.py`**:
   - Add award logic in the main processing loop
   - Include proper error handling
   - Use generic data for testing

2. **Update `app.py`**:
   - Add award to the display logic
   - Include in the awards configuration
   - Add proper styling

3. **Update Documentation**:
   - Add award description to README
   - Update configuration examples
   - Add to troubleshooting guide

### Modifying Existing Awards
- Maintain backward compatibility
- Update documentation
- Test with various league configurations
- Consider impact on existing users

## 🚀 Deployment Contributions

### GitHub Actions
- Test workflows locally first
- Use secrets for sensitive data
- Add proper error handling
- Document any new environment variables

### Streamlit Cloud
- Test deployment configuration
- Update secrets documentation
- Ensure compatibility with Streamlit Cloud
- Test with different user configurations

## 📚 Documentation

### README Updates
- Keep setup instructions current
- Add new features to the features list
- Update troubleshooting section
- Include screenshots for new features

### Code Documentation
- Add docstrings to new functions
- Update inline comments
- Document configuration options
- Add examples for complex features

## 🔍 Review Process

### Before Submitting
- [ ] Code follows style guidelines
- [ ] No private data committed
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] Self-review completed

### Review Checklist
- [ ] Code quality and style
- [ ] Security considerations
- [ ] Performance impact
- [ ] Documentation completeness
- [ ] Backward compatibility

## 🎯 Contribution Ideas

### 🏆 Awards System
- New award calculations
- Improved scoring algorithms
- Historical award tracking
- Award comparison features

### 📊 Visualizations
- New chart types
- Interactive features
- Mobile responsiveness
- Custom themes

### 🔧 Infrastructure
- Performance optimizations
- Caching improvements
- Error handling enhancements
- Deployment automation

### 📚 Documentation
- Setup guides
- Video tutorials
- API documentation
- Troubleshooting guides

## 📞 Getting Help

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Create an issue for bugs or feature requests
- **Documentation**: Check README.md and existing issues first

## 🏆 Recognition

Contributors will be:
- Listed in the README
- Mentioned in release notes
- Credited in the project documentation

Thank you for contributing to the FPL Dashboard! 🏆⚽
