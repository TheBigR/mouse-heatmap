import asyncio
import json
import numpy as np
import matplotlib.pyplot as plt
import websockets
import os
from collections import defaultdict
from datetime import datetime

WIDTH = 1920
HEIGHT = 1080

heatmap = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
is_recording = False

async def handler(websocket):
    global is_recording
    async for message in websocket:
        try:
            data = json.loads(message)
            
            # Handle control commands
            if data.get('type') == 'command':
                command = data.get('command')
                if command == 'start-recording':
                    is_recording = True
                    print('🔴 Recording started')
                    await websocket.send(json.dumps({
                        'type': 'recording-status',
                        'recording': True
                    }))
                elif command == 'stop-recording':
                    is_recording = False
                    print('⏹️ Recording stopped')
                    await websocket.send(json.dumps({
                        'type': 'recording-status',
                        'recording': False
                    }))
                elif command == 'generate-heatmap':
                    await generate_heatmap_now(websocket)
                continue
            
            # Only record mouse movements if recording is active
            if not is_recording:
                continue
                
            # Handle mouse movement data
            if 'x' in data and 'y' in data:
                x = int(data['x'])
                y = int(data['y'])

                if 0 <= x < WIDTH and 0 <= y < HEIGHT:
                    heatmap[y, x] += 1
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            print(f'⚠️ Error processing message: {e}')
            continue

async def generate_heatmap_now(websocket=None):
    """Generate heatmap immediately"""
    print(f'📊 Generating heatmap... Total data points: {heatmap.sum()}')
    
    if heatmap.sum() == 0:
        error_msg = 'No data recorded yet. Please start recording and move your mouse first.'
        print(f'⚠️ {error_msg}')
        if websocket:
            await websocket.send(json.dumps({
                'type': 'error',
                'message': error_msg
            }))
        return

    try:
        # Generate timestamp for filename
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        # Save in the same directory as the script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        filename = os.path.join(script_dir, f'heatmap_{timestamp}.png')
        
        print(f'💾 Saving heatmap to: {filename}')
        
        plt.figure(figsize=(12, 6))
        plt.imshow(heatmap, cmap='hot', interpolation='bilinear')
        plt.axis('off')
        plt.savefig(filename, bbox_inches='tight', pad_inches=0)
        plt.close()

        # Return just the filename (not full path) for display
        display_name = f'heatmap_{timestamp}.png'
        print(f'🔥 Heatmap generated successfully: {display_name}')
        
        if websocket:
            await websocket.send(json.dumps({
                'type': 'heatmap-generated',
                'message': f'Heatmap generated successfully: {display_name}',
                'filename': display_name
            }))
            print(f'✅ Sent heatmap-generated message to client')
    except Exception as e:
        error_msg = f'Failed to generate heatmap: {str(e)}'
        print(f'❌ {error_msg}')
        import traceback
        traceback.print_exc()
        if websocket:
            await websocket.send(json.dumps({
                'type': 'error',
                'message': error_msg
            }))

async def main():
    server = await websockets.serve(handler, 'localhost', 5000)
    print('Python WS on ws://localhost:5000')
    await server.wait_closed()

asyncio.run(main())
