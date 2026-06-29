import os
import sys

# Ensure that the agent directory and tools directory are in sys.path
agent_dir = os.path.dirname(os.path.abspath(__file__))
if agent_dir not in sys.path:
    sys.path.insert(0, agent_dir)

tools_dir = os.path.join(agent_dir, 'tools')
if tools_dir not in sys.path:
    sys.path.insert(0, tools_dir)
