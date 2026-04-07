import time
from locust import HttpUser, task, between, events
import socketio

class ChatUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # Initialize Socket.io Client
        self.sio = socketio.Client()
        self.user_id = f"user-{self.client.base_url}" # Simplified for testing
        
        @self.sio.on('receive_message')
        def on_message(data):
            # Track socket performance (optional)
            pass

        try:
            # Connect to your local server
            self.sio.connect(self.host)
            self.sio.emit('join', self.user_id)
        except Exception as e:
            print(f"Connection failed: {e}")

    @task
    def send_message(self):
        # Simulate sending a message every 1-3 seconds
        payload = {
            "senderId": self.user_id,
            "receiverId": "target-user-123",
            "chatId": "test-chat-room",
            "text": "Locust Load Test Message"
        }
        self.sio.emit('send_message', payload)

    def on_stop(self):
        self.sio.disconnect()
