"""WhatsApp Business API client"""
import httpx
from typing import Optional
from config import get_settings

settings = get_settings()


class WhatsAppClient:
    """Client for WhatsApp Business API"""
    
    def __init__(self):
        self.api_url = settings.whatsapp_api_url
        self.api_token = settings.whatsapp_api_token
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
    
    async def send_message(self, phone_number: str, message: str) -> dict:
        """
        Send a text message via WhatsApp Business API
        
        Args:
            phone_number: Recipient phone number in E.164 format
            message: Message content
            
        Returns:
            API response with message ID and status
        """
        async with httpx.AsyncClient() as client:
            payload = {
                "messaging_product": "whatsapp",
                "to": phone_number,
                "type": "text",
                "text": {
                    "body": message
                }
            }
            
            response = await client.post(
                f"{self.api_url}/messages",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def send_template(
        self, 
        phone_number: str, 
        template_name: str, 
        template_params: Optional[dict] = None
    ) -> dict:
        """
        Send a templated message via WhatsApp Business API
        
        Args:
            phone_number: Recipient phone number in E.164 format
            template_name: WhatsApp template name
            template_params: Template parameters
            
        Returns:
            API response with message ID and status
        """
        async with httpx.AsyncClient() as client:
            payload = {
                "messaging_product": "whatsapp",
                "to": phone_number,
                "type": "template",
                "template": {
                    "name": template_name,
                    "language": {
                        "code": "en"
                    }
                }
            }
            
            if template_params:
                payload["template"]["components"] = [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": str(value)}
                            for value in template_params.values()
                        ]
                    }
                ]
            
            response = await client.post(
                f"{self.api_url}/messages",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
