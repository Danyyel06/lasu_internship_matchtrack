import os

filepath = "c:/Users/User/lasu-internship-platform/frontend/src/pages/student/PulseDashboard.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add weekReflection state
state_search = "const [evidenceDesc, setEvidenceDesc] = useState('');"
state_replace = "const [evidenceDesc, setEvidenceDesc] = useState('');\n  const [weekReflection, setWeekReflection] = useState('');"
content = content.replace(state_search, state_replace)

# 2. Add setWeekReflection in fetchPulse
fetch_search = "const endorsements = res.data.supervisor_endorsements || [];"
fetch_replace = "const endorsements = res.data.supervisor_endorsements || [];\n        setWeekReflection(res.data.reflection || '');"
content = content.replace(fetch_search, fetch_replace)

# 3. Fix submitReflection payload
submit_search = """      const payload = {
        reflections: goals.filter(g => g.text.trim()).map((g, index) => ({
          goal_index: index,
          hit: g.status === 'hit',
          reflection_text: g.reflection || ''
        }))
      };"""
submit_replace = """      const payload = {
        goals_reflection: goals.filter(g => g.text.trim()).map((g, index) => ({
          goal_index: index,
          hit: g.status === 'hit'
        })),
        reflection: weekReflection
      };"""
content = content.replace(submit_search, submit_replace)

# 4. Remove per-goal reflection text box
per_goal_reflection_search = """                    <div>
                      <textarea
                        placeholder="Reflect on your progress (Max 140 chars)"
                        maxLength={140}
                        value={goal.reflection}
                        onChange={(e) => updateGoal(goal.id, 'reflection', e.target.value)}
                        className="w-full text-sm p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-600 outline-none resize-none h-20"
                      />
                    </div>"""
content = content.replace(per_goal_reflection_search, "")

# Remove the "Reflection submitted" text box
reflection_submitted_search = """                ) : (
                  <p className="text-sm text-neutral-800 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    "Reflection submitted."
                  </p>
                )}"""
content = content.replace(reflection_submitted_search, "                )} ")

# 5. Add Weekly Reflection block at the bottom
submit_btn_search = """        {currentDay === 'Sunday' && (
          <button
            onClick={submitReflection}
            className="w-full py-4 bg-violet-900 hover:bg-violet-800 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/20"
          >
            Submit Weekly Pulse
          </button>
        )}"""
weekly_reflection_block = """        {/* Weekly Reflection */}
        {(currentDay === 'Sunday' || currentDay === 'Past') && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">End of Week Reflection</h3>
              {currentDay === 'Sunday' ? (
                <textarea
                  placeholder="What did you learn this week? What challenged you? (Max 140 chars)"
                  maxLength={140}
                  value={weekReflection}
                  onChange={(e) => setWeekReflection(e.target.value)}
                  className="w-full text-sm p-4 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-violet-600 outline-none resize-none h-24"
                />
              ) : (
                <p className="text-neutral-800 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  {weekReflection || "No reflection provided."}
                </p>
              )}
            </div>
          </div>
        )}

        {currentDay === 'Sunday' && (
          <button
            onClick={submitReflection}
            className="w-full py-4 bg-violet-900 hover:bg-violet-800 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/20"
          >
            Submit Weekly Pulse
          </button>
        )}"""

content = content.replace(submit_btn_search, weekly_reflection_block)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewrote frontend code successfully!")
