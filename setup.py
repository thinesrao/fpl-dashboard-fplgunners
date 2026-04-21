#!/usr/bin/env python3
"""
FPL Dashboard Setup Script

This script helps you set up the FPL Dashboard by:
1. Creating config.py from config_template.py
2. Setting up the .streamlit directory
3. Validating your configuration
"""

import os
import shutil
import sys
from pathlib import Path

def create_config():
    """Create config.py from template if it doesn't exist."""
    if os.path.exists('config.py'):
        print("✅ config.py already exists")
        return True
    
    if not os.path.exists('config_template.py'):
        print("❌ config_template.py not found")
        return False
    
    try:
        shutil.copy('config_template.py', 'config.py')
        print("✅ Created config.py from template")
        return True
    except Exception as e:
        print(f"❌ Failed to create config.py: {e}")
        return False

def create_streamlit_dir():
    """Create .streamlit directory if it doesn't exist."""
    streamlit_dir = Path('.streamlit')
    if not streamlit_dir.exists():
        streamlit_dir.mkdir()
        print("✅ Created .streamlit directory")
    else:
        print("✅ .streamlit directory already exists")
    
    # Create secrets.toml template
    secrets_file = streamlit_dir / 'secrets.toml'
    if not secrets_file.exists():
        secrets_content = '''# Streamlit Secrets Configuration
# Copy your Google service account JSON here

[gcp_service_account]
# Paste your entire Google service account JSON here
# Example:
# type = "service_account"
# project_id = "your-project-id"
# private_key_id = "your-private-key-id"
# private_key = "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
# client_email = "your-service-account@your-project.iam.gserviceaccount.com"
# client_id = "your-client-id"
# auth_uri = "https://accounts.google.com/o/oauth2/auth"
# token_uri = "https://oauth2.googleapis.com/token"
# auth_provider_x509_cert_url = "https://www.googleapis.com/oauth2/v1/certs"
# client_x509_cert_url = "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"
'''
        secrets_file.write_text(secrets_content)
        print("✅ Created .streamlit/secrets.toml template")
    else:
        print("✅ .streamlit/secrets.toml already exists")

def validate_config():
    """Validate that config.py has been updated with real values."""
    try:
        import config
        
        # Check if still using template values
        template_values = {
            'CLASSIC_LEAGUE_ID': 123456,
            'H2H_LEAGUE_ID': 789012,
            'FPL_CHALLENGE_LEAGUE_ID': 345678,
            'GOOGLE_SHEET_NAME': "FPL-Data-YourLeague"
        }
        
        issues = []
        for key, template_value in template_values.items():
            if hasattr(config, key):
                current_value = getattr(config, key)
                if current_value == template_value:
                    issues.append(f"  - {key} still has template value: {template_value}")
        
        if issues:
            print("⚠️  Configuration still contains template values:")
            for issue in issues:
                print(issue)
            print("\nPlease update config.py with your actual league information.")
            return False
        else:
            print("✅ Configuration appears to be updated")
            return True
            
    except ImportError:
        print("❌ config.py not found. Run setup first.")
        return False
    except Exception as e:
        print(f"❌ Error validating config: {e}")
        return False

def check_credentials():
    """Check if Google credentials are set up."""
    credentials_file = Path('.streamlit/google_credentials.json')
    secrets_file = Path('.streamlit/secrets.toml')
    
    if credentials_file.exists():
        print("✅ Google credentials file found (.streamlit/google_credentials.json)")
        return True
    elif secrets_file.exists():
        # Check if secrets.toml has actual credentials
        try:
            import toml
            secrets = toml.load(secrets_file)
            if 'gcp_service_account' in secrets and secrets['gcp_service_account']:
                print("✅ Google credentials found in secrets.toml")
                return True
        except:
            pass
    
    print("⚠️  Google credentials not found")
    print("   Please add your Google service account credentials to either:")
    print("   - .streamlit/google_credentials.json (JSON file)")
    print("   - .streamlit/secrets.toml (for deployment)")
    return False

def main():
    """Main setup function."""
    print("🏆 FPL Dashboard Setup")
    print("=" * 50)
    
    # Step 1: Create config.py
    print("\n1. Setting up configuration...")
    if not create_config():
        print("❌ Setup failed at configuration step")
        return False
    
    # Step 2: Create .streamlit directory
    print("\n2. Setting up Streamlit directory...")
    create_streamlit_dir()
    
    # Step 3: Validate configuration
    print("\n3. Validating configuration...")
    config_valid = validate_config()
    
    # Step 4: Check credentials
    print("\n4. Checking Google credentials...")
    credentials_ok = check_credentials()
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Setup Summary:")
    print(f"   Configuration: {'✅' if config_valid else '⚠️'}")
    print(f"   Credentials: {'✅' if credentials_ok else '⚠️'}")
    
    if config_valid and credentials_ok:
        print("\n🎉 Setup complete! You can now run:")
        print("   streamlit run app.py")
    else:
        print("\n⚠️  Setup incomplete. Please:")
        if not config_valid:
            print("   - Update config.py with your league information")
        if not credentials_ok:
            print("   - Add your Google service account credentials")
        print("\n   Then run this setup script again.")
    
    print("\n📚 For detailed instructions, see README.md")

if __name__ == "__main__":
    main()