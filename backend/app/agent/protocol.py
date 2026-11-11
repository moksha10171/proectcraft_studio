"""Translate canonical tool history at the provider boundary, preserving call IDs."""
import json


def openai_messages(messages: list[dict]) -> list[dict]:
    output = []
    for message in messages:
        role, text = message.get('role', 'user'), message.get('content') or ''
        calls = message.get('calls') or []
        if role == 'assistant':
            item = {'role': 'assistant', 'content': text or None}
            if calls:
                item['tool_calls'] = [{'id': c['call_id'], 'type': 'function', 'function': {'name': c['tool'], 'arguments': json.dumps(c['args'])}} for c in calls]
            output.append(item)
        elif role in ('tool', 'tool_result'):
            if message.get('call_id'):
                output.append({'role': 'tool', 'tool_call_id': message['call_id'], 'content': text})
            else:
                output.append({'role': 'user', 'content': f'[Tool result]: {text}'})
        else:
            output.append({'role': role, 'content': text})
    return output


def gemini_messages(messages: list[dict]) -> list[dict]:
    output = []
    for message in messages:
        role, text = message.get('role', 'user'), message.get('content') or ''
        if role == 'system':
            continue
        parts = []
        if role in ('tool', 'tool_result') and message.get('call_id'):
            parts.append({'functionResponse': {'name': message['tool'], 'response': {'result': text}}})
        else:
            if text:
                parts.append({'text': text})
            for call in message.get('calls') or []:
                parts.append({'functionCall': {'name': call['tool'], 'args': call['args']}, **({'thoughtSignature': call['signature']} if call.get('signature') else {})})
        if parts:
            mapped = 'model' if role == 'assistant' else 'user'
            if output and output[-1]['role'] == mapped:
                output[-1]['parts'].extend(parts)
            else:
                output.append({'role': mapped, 'parts': parts})
    return output


def anthropic_messages(messages: list[dict]) -> list[dict]:
    output = []
    for message in messages:
        role, text = message.get('role', 'user'), message.get('content') or ''
        if role == 'system':
            continue
        blocks = []
        if role in ('tool', 'tool_result') and message.get('call_id'):
            blocks.append({'type': 'tool_result', 'tool_use_id': message['call_id'], 'content': text})
        else:
            if text:
                blocks.append({'type': 'text', 'text': text})
            for call in message.get('calls') or []:
                blocks.append({'type': 'tool_use', 'id': call['call_id'], 'name': call['tool'], 'input': call['args']})
        mapped = 'assistant' if role == 'assistant' else 'user'
        if blocks:
            if output and output[-1]['role'] == mapped:
                output[-1]['content'].extend(blocks)
            else:
                output.append({'role': mapped, 'content': blocks})
    return output
