I want to add an in-app emotion notification system to the Emotion City map to indicate when an emotion becomes extremely high.

1. Emotion Alert Trigger
- Each emotion already has an intensity value from 0–100.
- When an emotion crosses a high threshold (for example above 90), trigger an alert state.

2. Building Alert Indicator
- When an emotion becomes extreme, display a small animated "!" alert icon near the corresponding building.
- The alert icon should appear slightly above or next to the building.
- The icon should animate to attract attention (for example pulse, bounce, or glow animation).
- The animation should loop until the emotion level returns to normal.

3. In-App Notification
When the alert triggers, also show a small in-app notification card.

Example text:
"Emotion Alert: Anger spike detected."

The notification should:
- appear briefly on the screen
- include the emotion name
- suggest checking the building for more details
- fade out automatically after a few seconds.

4. Building Highlight
While the alert is active:
- highlight the building (glow or outline effect)
- keep the building clickable so the user can open the emotion insight panel.

5. Alert Interaction and Action Suggestions
- When the user clicks the "!" alert indicator, show a small action suggestion panel.
- The panel should contain recommended actions to help relieve or rebalance the emotion.

Example suggestions:
Anger:
- Take a 30-second breathing reset
- Step away and take a short walk
- Write down what triggered the emotion

Sadness:
- Write one positive moment from today
- Reach out to a friend or family member
- Try a short gratitude reflection

The suggestion panel should appear near the building or as a small overlay and should not block the entire map.

6. Reset Behavior
If the emotion level goes back below the threshold:
- remove the alert icon
- stop the animation
- return the building to its normal state.

Important:
Do not change the layout of the city map. Only add the animated alert indicator, the in-app notification behavior, and the action suggestion interaction tied to emotion intensity changes.