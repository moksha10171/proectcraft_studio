from app.agent.protocol import openai_messages, gemini_messages, anthropic_messages

HISTORY = [
    {'role': 'user', 'content': 'Read the sketch'},
    {'role': 'assistant', 'content': '', 'calls': [{'tool': 'READ_FILE', 'args': {'path': 'sketch.ino'}, 'call_id': 'call-a'}]},
    {'role': 'tool', 'content': 'void setup(){}', 'tool': 'READ_FILE', 'call_id': 'call-a'},
]


def test_openai_native_tool_history_preserves_ids_and_arguments():
    messages = openai_messages(HISTORY)
    assert messages[1]['tool_calls'][0]['id'] == messages[2]['tool_call_id'] == 'call-a'
    assert messages[1]['tool_calls'][0]['function']['arguments'] == '{"path": "sketch.ino"}'


def test_gemini_history_has_function_responses_instead_of_flattened_prose():
    messages = gemini_messages(HISTORY)
    assert messages[1]['parts'][0]['functionCall']['name'] == 'READ_FILE'
    assert messages[2]['parts'][0]['functionResponse']['response']['result'] == 'void setup(){}'


def test_anthropic_tool_results_match_native_use_ids():
    messages = anthropic_messages(HISTORY)
    assert messages[1]['content'][0]['id'] == messages[2]['content'][0]['tool_use_id'] == 'call-a'
