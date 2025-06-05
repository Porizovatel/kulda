#!/usr/bin/env python3
import os
import sys
import json
import logging
from datetime import datetime
from http.client import HTTPConnection
from urllib.parse import urlparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('influxdb_check.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def load_env():
    """Load environment variables from .env file"""
    env_vars = {}
    try:
        with open('.env') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip().strip('"\'')
    except FileNotFoundError:
        logger.error("No .env file found")
        return None
    except Exception as e:
        logger.error(f"Error reading .env file: {e}")
        return None
    return env_vars

def check_url_format(url):
    """Validate URL format"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except Exception as e:
        logger.error(f"Invalid URL format: {e}")
        return False

def check_port_open(host, port):
    """Check if port is open"""
    conn = HTTPConnection(host, port, timeout=5)
    try:
        conn.connect()
        logger.info(f"Port {port} is open on {host}")
        return True
    except Exception as e:
        logger.error(f"Port {port} is not accessible on {host}: {e}")
        return False
    finally:
        conn.close()

def check_cors_headers(url, token):
    """Check CORS configuration"""
    import http.client
    from urllib.parse import urlparse

    parsed_url = urlparse(url)
    conn = http.client.HTTPConnection(parsed_url.hostname, parsed_url.port)
    
    headers = {
        'Authorization': f'Token {token}',
        'Origin': 'http://localhost:5173'
    }
    
    try:
        conn.request('OPTIONS', '/api/v2/ping', headers=headers)
        response = conn.getresponse()
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.getheader('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.getheader('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.getheader('Access-Control-Allow-Headers')
        }
        
        logger.info("CORS Headers:")
        for header, value in cors_headers.items():
            if value:
                logger.info(f"  {header}: {value}")
            else:
                logger.warning(f"  Missing CORS header: {header}")
                
        return all(cors_headers.values())
    except Exception as e:
        logger.error(f"Error checking CORS headers: {e}")
        return False
    finally:
        conn.close()

def check_influxdb():
    """Main function to check InfluxDB connection"""
    logger.info("Starting InfluxDB connection check")
    
    # Load environment variables
    env_vars = load_env()
    if not env_vars:
        logger.error("Failed to load environment variables")
        return False
    
    url = env_vars.get('VITE_INFLUXDB_URL')
    token = env_vars.get('VITE_INFLUXDB_TOKEN')
    
    if not url or not token:
        logger.error("Missing required environment variables (VITE_INFLUXDB_URL or VITE_INFLUXDB_TOKEN)")
        return False
    
    # Check URL format
    if not check_url_format(url):
        logger.error(f"Invalid InfluxDB URL format: {url}")
        return False
    
    # Parse URL
    parsed_url = urlparse(url)
    host = parsed_url.hostname
    port = parsed_url.port or 8086
    
    # Check if port is open
    if not check_port_open(host, port):
        return False
    
    # Check CORS configuration
    if not check_cors_headers(url, token):
        logger.warning("CORS configuration may not be properly set")
    
    # Check Docker container status
    try:
        import subprocess
        result = subprocess.run(['docker', 'ps', '--filter', 'name=influxdb', '--format', '{{.Status}}'], 
                              capture_output=True, text=True)
        if result.stdout.strip():
            logger.info(f"InfluxDB container status: {result.stdout.strip()}")
        else:
            logger.warning("InfluxDB container not found")
    except Exception as e:
        logger.error(f"Error checking Docker container status: {e}")
    
    logger.info("InfluxDB connection check completed")
    return True

if __name__ == "__main__":
    check_influxdb()