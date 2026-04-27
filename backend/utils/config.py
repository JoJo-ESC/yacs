"""                         
  Utility functions for loading configuration and secrets from YAML files.       
  """                                                 
  import os
  from typing import Any, Dict                                                      
   
  import yaml                                                                       
                       
  # Compute paths relative to this file's location
  # backend/utils/config.py -> backend/utils -> backend -> backend/configs
  _THIS_DIR = os.path.dirname(os.path.abspath(__file__))                            
  _BACKEND_DIR = os.path.dirname(_THIS_DIR)
  _CONFIGS_DIR = os.path.join(_BACKEND_DIR, "configs")                              
                                                                                    
  _DEFAULT_CONFIG_PATH = os.path.join(_CONFIGS_DIR, "config.yaml")
  _DEFAULT_SECRETS_PATH = os.path.join(_CONFIGS_DIR, "secrets.yaml")                
                                                                                    
  
  def _load_yaml_file(path: str, name: str) -> Dict[str, Any]:                      
      """              
      Helper to load any YAML file with a consistent error message.
      """
      if not os.path.exists(path):
          raise FileNotFoundError(f"{name} file not found at: {path}")              
      with open(path, "r") as f:
          return yaml.safe_load(f) or {}                                            
                       
                                                                                    
  def load_config(config_path: str = None) -> Dict[str, Any]:
      """                                                                           
      Load application configuration from a YAML file.

      Args:
          config_path: Path to the configuration YAML file. Defaults to 
  configs/config.yaml.                                                              
  
      Returns:                                                                      
          Configuration dict.

      Raises:
          FileNotFoundError: If the config file is not found.
      """
      path = config_path if config_path else _DEFAULT_CONFIG_PATH
      return _load_yaml_file(path, "config.yaml")
                                                                                    
  
  def load_secrets(secrets_path: str = None) -> Dict[str, Any]:                     
      """              
      Load application secrets from a YAML file.

      Args:
          secrets_path: Path to the secrets YAML file. Defaults to 
  configs/secrets.yaml.                                                             
  
      Returns:                                                                      
          Secrets dict, or empty dict if the file doesn't exist (callers fall back 
  to env vars / defaults).                                                          
      """
      path = secrets_path if secrets_path else _DEFAULT_SECRETS_PATH                
      if not os.path.exists(path):
          return {}
      return _load_yaml_file(path, "secrets.yaml")