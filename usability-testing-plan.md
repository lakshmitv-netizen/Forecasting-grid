# Usability Testing Plan
## Forecasting & Planning Tool Prototype

**Version:** 6.0  
**Date:** December 2025  
**Testing Duration:** 75-105 minutes per session  
**Target Users:** Financial analysts, planning managers, data analysts

**New Features in v6.0:**
- Mass update functionality for multiple cells
- Multi-cell selection (Shift+Click, Cmd/Ctrl+Click)
- Automatic cell selection based on criteria
- Measure reordering and visibility controls
- Column freezing functionality
- Enhanced cell editing workflow (double-click to edit)

---

## Pre-Testing Setup

### Environment Preparation
- [ ] Ensure prototype is running on `http://localhost:5173` or deployed URL
- [ ] Clear browser cache and localStorage
- [ ] Have screen recording software ready (optional but recommended)
- [ ] Prepare note-taking template for observer

### Participant Briefing
**Script:** "Thank you for participating in this usability test. You'll be working with a forecasting and planning tool prototype. I'll ask you some questions and give you some tasks, but I want to see how you naturally approach the tool. Please think aloud as you work, sharing what you're looking at, what you're thinking, what you're trying to do, and any questions or thoughts you have. There are no right or wrong answers - we're testing the tool, not you. Feel free to explore and experiment. The session will take about 60-90 minutes. Do you have any questions before we begin?"

### Test Data Context
**Provide to participant:** "You are a financial analyst reviewing forecast data for 2026. The grid shows Sales Agreement Revenue and Sales Agreement Quantity across different accounts, product categories, and products. Take a moment to familiarize yourself with what you're seeing."

---

## Test Tasks

### **Task 1: Initial Exploration**
**Task:** "Spend a couple of minutes exploring what you see here. Walk me through what catches your attention and what you think this tool is for."

**What to Observe:**
- [ ] What do they notice first?
- [ ] How do they describe the interface?
- [ ] What terminology do they use?
- [ ] Do they understand the data structure?
- [ ] What questions do they have?
- [ ] What seems intuitive or confusing?

**Success Criteria:** User can describe the tool's purpose and basic structure

---

### **Task 2: Data Organization**
**Task:** "Look at how the data is organized. What do you notice about the rows and columns? How are they related to each other?"

**What to Observe:**
- [ ] Do they notice hierarchical relationships?
- [ ] Do they understand parent/child relationships?
- [ ] Can they identify measures, dimensions, and time periods?
- [ ] Do they notice expand/collapse functionality?
- [ ] How do they describe the organization?

**Success Criteria:** User recognizes hierarchical structure and data relationships

---

### **Task 3: Changing the View**
**Task:** "Suppose you wanted to see this same data organized differently - maybe with rows and columns swapped, or showing different levels of detail. How would you go about that?"

**What to Observe:**
- [ ] Where do they look for view options?
- [ ] Do they discover layout switching?
- [ ] Do they find dimension/time granularity controls?
- [ ] Can they change what's visible?
- [ ] Do they understand the layout notation?

**Success Criteria:** User discovers customization options

---

### **Task 4: Toolbar Exploration**
**Task:** "Look at the toolbar area. What do you think each of those icons and controls does? Feel free to click around and explore."

**What to Observe:**
- [ ] Which controls do they notice?
- [ ] What do they think each icon does?
- [ ] Do they try clicking them?
- [ ] What panels or features open?
- [ ] Do they understand the search functionality?
- [ ] Are controls discoverable?

**Success Criteria:** User explores toolbar and discovers key functions

---

### **Task 5: Modifying Values (Single Cell)**
**Task:** "Imagine you need to update a forecast number. How would you go about changing it? What do you think will happen when you do?"

**What to Observe:**
- [ ] How do they approach editing?
- [ ] What interactions do they try? (double-click, Enter key)
- [ ] Do they discover editing capability?
- [ ] What visual feedback appears?
- [ ] Do they understand how to save?
- [ ] What happens after editing?

**Success Criteria:** User discovers editing and understands the workflow

---

### **Task 5b: Multi-Cell Selection**
**Task:** "Now imagine you need to update multiple cells at once. How would you select multiple cells? Try selecting several cells together."

**What to Observe:**
- [ ] How do they try to select multiple cells?
- [ ] Do they discover Shift+Click or Cmd/Ctrl+Click?
- [ ] Do they notice the selection indicators?
- [ ] Can they select cells across different rows/columns?
- [ ] What happens when they select multiple cells?
- [ ] Do they see any UI changes when multiple cells are selected?

**Success Criteria:** User discovers multi-cell selection functionality

---

### **Task 5c: Mass Update Feature**
**Task:** "You've selected multiple cells. Now you want to update all of them at once - maybe increase them all by 10% or set them all to a specific value. How would you do that?"

**What to Observe:**
- [ ] How do they try to update multiple cells?
- [ ] Do they discover the Cell Details & Updates panel?
- [ ] Do they find the Multi-cell tab?
- [ ] Do they discover the mass update form?
- [ ] Can they understand the update rules (Increase, Decrease, Set to, Multiply by, Divide by)?
- [ ] Do they try percentage vs absolute values?
- [ ] Can they add a bulk adjustment note?
- [ ] What happens when they click Update?
- [ ] Do all selected cells update correctly?
- [ ] Do they see impacted cells update as well?
- [ ] Do they notice the context menu "Mass Update" option?

**Success Criteria:** User discovers and successfully uses mass update functionality

---

### **Task 6: Understanding Changes**
**Task:** "After you change a value, look around the grid. What else changed? Why do you think that happened?"

**What to Observe:**
- [ ] Do they notice related values updated?
- [ ] Do they understand propagation?
- [ ] What visual indicators do they notice?
- [ ] Do they see different cell states (edited vs impacted)?
- [ ] Can they explain the relationships?
- [ ] Do they notice the save footer appearing?

**Success Criteria:** User recognizes automatic value updates and understands propagation

---

### **Task 7: Finding Specific Information**
**Task:** "You need to find data for a particular product or a specific month. How would you locate that?"

**What to Observe:**
- [ ] How do they approach finding data?
- [ ] Do they discover search functionality?
- [ ] Do they find filtering options?
- [ ] What search terms do they try?
- [ ] Is highlighting helpful?
- [ ] Which method do they prefer?

**Success Criteria:** User discovers search or filtering functionality

---

### **Task 8: Adding Context**
**Task:** "You want to document why you made a particular change. How would you add that information?"

**What to Observe:**
- [ ] How do they try to add documentation?
- [ ] When do they discover note functionality?
- [ ] What interaction reveals notes?
- [ ] Can they add a note successfully?
- [ ] Do they see note indicators on cells?
- [ ] Is the workflow intuitive?

**Success Criteria:** User discovers and uses note functionality

---

### **Task 9: Tracking History**
**Task:** "You want to see what changes have been made to a cell and who made them. How would you find that information?"

**What to Observe:**
- [ ] Where do they look for history?
- [ ] What actions do they try?
- [ ] Do they discover the cell details panel?
- [ ] What information is displayed?
- [ ] Can they understand the history entries?
- [ ] Is the information useful?

**Success Criteria:** User finds and understands edit history

---

### **Task 10: Collaborating**
**Task:** "You want to discuss a change with your team. How would you add a comment or start a discussion?"

**What to Observe:**
- [ ] How do they try to add comments?
- [ ] Do they discover discussion features?
- [ ] Where do they look?
- [ ] Can they add comments successfully?
- [ ] Do they see existing discussions?
- [ ] Is the collaboration feature discoverable?

**Success Criteria:** User discovers and uses comment/discussion functionality

---

### **Task 11: Protecting Data**
**Task:** "You want to make sure a certain value doesn't get accidentally changed. How would you protect it?"

**What to Observe:**
- [ ] How do they try to protect cells?
- [ ] Do they discover locking functionality?
- [ ] Where do they look?
- [ ] Do they try right-click menu?
- [ ] What visual indicator appears?
- [ ] Can they verify it's protected?

**Success Criteria:** User discovers cell locking functionality

---

### **Task 12: Reversing Actions**
**Task:** "You just made a change but realize it was wrong. How would you undo it?"

**What to Observe:**
- [ ] How do they try to undo?
- [ ] Where do they look for undo?
- [ ] Do they discover undo functionality?
- [ ] Does it work as expected?
- [ ] Do they find redo?
- [ ] Is the functionality discoverable?

**Success Criteria:** User discovers undo/redo functionality

---

### **Task 13: Saving Work**
**Task:** "You've made several changes. How do you save them? What if you decide you don't want to keep these changes?"

**What to Observe:**
- [ ] Where do they look for save?
- [ ] Do they understand draft vs saved state?
- [ ] How do they discard changes?
- [ ] Is the workflow clear?
- [ ] What happens when they save/cancel?

**Success Criteria:** User finds save and cancel functionality

---

### **Task 14: Visual Cues**
**Task:** "Look at the different cells in the grid. What visual differences do you notice? What do you think those differences mean?"

**What to Observe:**
- [ ] What visual indicators do they notice?
- [ ] Do they see color differences?
- [ ] Do they notice arrows, icons, or symbols?
- [ ] What do they think indicators mean?
- [ ] Are readonly cells visually distinct?
- [ ] Is the visual language clear?

**Success Criteria:** User notices and interprets visual indicators

---

### **Task 15: Filtering Views**
**Task:** "You only want to see certain types of data - maybe just the rows or columns that were affected by changes. How would you filter the view?"

**What to Observe:**
- [ ] How do they try to filter?
- [ ] Do they discover impacted measures filter?
- [ ] Where do they look?
- [ ] What happens when they enable filtering?
- [ ] Do they understand what "impacted" means?
- [ ] Is the filtered view useful?

**Success Criteria:** User discovers filtering options

---

### **Task 16: Cell Information**
**Task:** "You want to know more about a specific cell - maybe who last changed it, when, or what it represents. How would you get that information?"

**What to Observe:**
- [ ] What actions do they try?
- [ ] Do they discover the info popover?
- [ ] Do they find the cell details panel?
- [ ] What information is shown?
- [ ] Can they access dimension hierarchy?
- [ ] Is the information discoverable?

**Success Criteria:** User finds cell information display

---

### **Task 18: Reordering Measures**
**Task:** "You want to change the order in which measures appear in the grid, or hide some measures you don't need. How would you do that?"

**What to Observe:**
- [ ] Where do they look for measure ordering options?
- [ ] Do they discover the Settings panel?
- [ ] Do they find the Reorder Measures option?
- [ ] Can they understand the reorder modal?
- [ ] Do they try changing the order numbers?
- [ ] Do they use the visibility checkboxes?
- [ ] Can they use the master checkbox to toggle all?
- [ ] Do they understand the Update Sequence and Reset buttons?
- [ ] Do they notice the sort button in the Order column?
- [ ] Can they successfully reorder measures?

**Success Criteria:** User discovers and uses measure reordering functionality

---

### **Task 19: Overall Exploration**
**Task:** "Take a few minutes to explore anything that interests you. What features did you discover? What surprised you? What would you want to use in your daily work?"

**What to Observe:**
- [ ] What features do they discover on their own?
- [ ] What surprises them?
- [ ] What features do they find useful?
- [ ] What features do they miss?
- [ ] What would they want to use?
- [ ] What seems unnecessary?

**Success Criteria:** User discovers additional features through exploration

---

## Experience Rating Questions

After completing the exploration tasks, ask the following rating questions:

### **Rating 1: Overall Ease of Use**
**Question:** "On a scale of 1 to 5, where 1 is very difficult and 5 is very easy, how easy was it to use this tool overall?"

**Rating:** ___ / 5

**Follow-up:** "What made it easy or difficult?"

---

### **Rating 2: Feature Discoverability**
**Question:** "On a scale of 1 to 5, where 1 is very hard to find and 5 is very easy to find, how easy was it to discover features without instructions?"

**Rating:** ___ / 5

**Follow-up:** "Which features were easiest to find? Which were hardest?"

---

### **Rating 3: Visual Clarity**
**Question:** "On a scale of 1 to 5, where 1 is very unclear and 5 is very clear, how clear were the visual indicators and feedback?"

**Rating:** ___ / 5

**Follow-up:** "Which visual cues were most helpful? Which were confusing?"

---

### **Rating 4: Value Propagation Understanding**
**Question:** "On a scale of 1 to 5, where 1 is very confusing and 5 is very clear, how well did you understand how values update automatically?"

**Rating:** ___ / 5

**Follow-up:** "Was the automatic updating helpful or surprising?"

---

### **Rating 5: Layout Comprehension**
**Question:** "On a scale of 1 to 5, where 1 is very confusing and 5 is very clear, how well did you understand the different layout options?"

**Rating:** ___ / 5

**Follow-up:** "Did the layout notation make sense to you?"

---

### **Rating 6: Editing Workflow**
**Question:** "On a scale of 1 to 5, where 1 is very difficult and 5 is very easy, how easy was it to edit cells and add notes?"

**Rating:** ___ / 5

**Follow-up:** "What worked well? What could be improved?"

---

### **Rating 7: Search and Filtering**
**Question:** "On a scale of 1 to 5, where 1 is not useful and 5 is very useful, how useful did you find the search and filtering features?"

**Rating:** ___ / 5

**Follow-up:** "Did you find what you were looking for easily?"

---

### **Rating 8: Edit History and Collaboration**
**Question:** "On a scale of 1 to 5, where 1 is not useful and 5 is very useful, how useful did you find the edit history and comment features?"

**Rating:** ___ / 5

**Follow-up:** "Would you use these features in your daily work?"

---

### **Rating 9: Mass Update Feature**
**Question:** "On a scale of 1 to 5, where 1 is not useful and 5 is very useful, how useful did you find the mass update feature for updating multiple cells at once?"

**Rating:** ___ / 5

**Follow-up:** "Would you use this feature frequently? What improvements would you suggest?"

---

### **Rating 10: Multi-Cell Selection**
**Question:** "On a scale of 1 to 5, where 1 is very difficult and 5 is very easy, how easy was it to select multiple cells?"

**Rating:** ___ / 5

**Follow-up:** "Was the selection process intuitive? What would make it better?"

---

### **Rating 11: Measure Reordering**
**Question:** "On a scale of 1 to 5, where 1 is not useful and 5 is very useful, how useful did you find the ability to reorder and hide measures?"

**Rating:** ___ / 5

**Follow-up:** "Would you customize the measure order frequently?"

---

### **Rating 12: Overall Satisfaction**
**Question:** "On a scale of 1 to 5, where 1 is very dissatisfied and 5 is very satisfied, how satisfied are you with this tool overall?"

**Rating:** ___ / 5

**Follow-up:** "What would make you more satisfied?"

---

### **Rating 13: Likelihood to Use**
**Question:** "On a scale of 1 to 5, where 1 is very unlikely and 5 is very likely, how likely are you to use this tool in your daily work?"

**Rating:** ___ / 5

**Follow-up:** "What would need to change for you to use it more?"

---

## Post-Testing Questionnaire

### Overall Experience (1-5 scale, 5 = Excellent)

1. **Ease of Use:** How easy was it to use the tool? (1-5)
   - Comments: _______________________________

2. **Learning Curve:** How quickly did you understand how to use it? (1-5)
   - Comments: _______________________________

3. **Visual Design:** How would you rate the visual design? (1-5)
   - Comments: _______________________________

4. **Feature Completeness:** Do you feel all necessary features are present? (1-5)
   - Comments: _______________________________

5. **Performance:** How would you rate the speed and responsiveness? (1-5)
   - Comments: _______________________________

### Feature Discoverability (1-5 scale)

6. **How easy was it to find features without instructions?** (1-5)
   - Comments: _______________________________

7. **Were controls where you expected them?** (1-5)
   - Comments: _______________________________

8. **Did visual cues help you discover functionality?** (1-5)
   - Comments: _______________________________

### Feature Usefulness (1-5 scale)

9. **Cell Editing:** How useful is the editing functionality? (1-5)
   - Comments: _______________________________

10. **Value Propagation:** How useful is automatic value updating? (1-5)
    - Comments: _______________________________

11. **Search Functionality:** How useful is the search feature? (1-5)
    - Comments: _______________________________

12. **Adjustment Notes:** How useful is adding notes to cells? (1-5)
    - Comments: _______________________________

13. **Edit History:** How useful is viewing change history? (1-5)
    - Comments: _______________________________

14. **Cell Locking:** How useful is locking cells? (1-5)
    - Comments: _______________________________

15. **Layout Switching:** How useful is changing grid layouts? (1-5)
    - Comments: _______________________________

16. **Mass Update:** How useful is updating multiple cells at once? (1-5)
    - Comments: _______________________________

17. **Multi-Cell Selection:** How easy was it to select multiple cells? (1-5)
    - Comments: _______________________________

18. **Automatic Cell Selection:** How useful is selecting cells by criteria? (1-5)
    - Comments: _______________________________

19. **Measure Reordering:** How useful is reordering and hiding measures? (1-5)
    - Comments: _______________________________

20. **Column Freezing:** How useful is freezing the first column? (1-5)
    - Comments: _______________________________

### Comprehension (1-5 scale)

21. **Grid Structure:** How well did you understand the grid structure? (1-5)
    - Comments: _______________________________

22. **Data Relationships:** How clear were parent/child relationships? (1-5)
    - Comments: _______________________________

23. **Value Propagation:** How well did you understand automatic updates? (1-5)
    - Comments: _______________________________

24. **Visual Indicators:** How well did you understand visual feedback? (1-5)
    - Comments: _______________________________

25. **Layout Notation:** How well did you understand what "Measures / Dimensions x Time" means? (1-5)
    - Comments: _______________________________

26. **Mass Update Rules:** How well did you understand the mass update rules (Increase, Decrease, Set to, etc.)? (1-5)
    - Comments: _______________________________

27. **Cell Selection Criteria:** How well did you understand automatic cell selection criteria? (1-5)
    - Comments: _______________________________

### Open-Ended Questions

28. **What did you like most about the tool?**
    - _______________________________________________

29. **What features were difficult to discover?**
    - _______________________________________________

30. **What features were easy to discover?**
    - _______________________________________________

31. **What did you find confusing or unclear?**
    - _______________________________________________

32. **What features did you find most useful?**
    - _______________________________________________

33. **What features did you find least useful?**
    - _______________________________________________

34. **What features are missing that you would need?**
    - _______________________________________________

35. **What would you change to make features more discoverable?**
    - _______________________________________________

36. **What visual indicators were most helpful?**
    - _______________________________________________

37. **What visual indicators were confusing or unclear?**
    - _______________________________________________

38. **How did you interpret the layout notation (Measures / Dimensions x Time)?**
    - _______________________________________________

39. **Where did you expect to find controls for changing the grid layout?**
    - _______________________________________________

40. **What surprised you about the tool?**
    - _______________________________________________

41. **What features did you discover that you weren't expecting?**
    - _______________________________________________

42. **How did you discover the mass update feature?**
    - _______________________________________________

43. **What did you think about the mass update workflow?**
    - _______________________________________________

44. **Would you use mass update frequently? For what scenarios?**
    - _______________________________________________

45. **What improvements would you suggest for mass update?**
    - _______________________________________________

46. **How did you find the automatic cell selection feature?**
    - _______________________________________________

47. **Would you use automatic cell selection? Why or why not?**
    - _______________________________________________

48. **What did you think about the measure reordering feature?**
    - _______________________________________________

49. **Would you use this tool in your daily work? Why or why not?**
    - _______________________________________________

50. **How does this compare to tools you currently use?**
    - _______________________________________________

51. **Any other comments or suggestions?**
    - _______________________________________________

---

## Success Criteria

### Critical Success Metrics
- ✅ **Comprehension Rate:** >80% of users understand grid structure and relationships
- ✅ **Discovery Rate:** >70% of critical features discovered without guidance
- ✅ **Usefulness Rating:** Average usefulness rating >3.5/5.0
- ✅ **Task Completion Rate:** >75% of tasks completed successfully
- ✅ **User Satisfaction:** Average rating >3.5/5.0

### Feature-Specific Success Criteria

| Feature | Discovery Rate | Usefulness Rating | Comprehension |
|---------|---------------|-------------------|---------------|
| Cell Editing (Single) | >85% | >4.0/5.0 | >90% understand workflow |
| Multi-Cell Selection | >70% | >4.0/5.0 | >85% can select multiple cells |
| Mass Update | >60% | >4.0/5.0 | >80% understand rules and workflow |
| Automatic Cell Selection | >50% | >3.5/5.0 | >70% understand criteria building |
| Value Propagation | >70% | >4.0/5.0 | >80% understand behavior |
| Search | >80% | >4.0/5.0 | >85% can use effectively |
| Adjustment Notes | >60% | >3.5/5.0 | >75% understand purpose |
| Edit History | >65% | >4.0/5.0 | >80% can interpret entries |
| Cell Locking | >50% | >3.5/5.0 | >75% understand protection |
| Layout Switching | >70% | >3.5/5.0 | >80% understand options |
| Measure Reordering | >60% | >3.5/5.0 | >75% can reorder successfully |
| Column Freezing | >55% | >3.5/5.0 | >80% understand functionality |
| Settings Panel | >75% | >3.5/5.0 | >80% can navigate options |
| Layout Notation | >60% | >3.5/5.0 | >70% understand meaning |

### Qualitative Success Indicators
- Users express understanding of grid structure and relationships
- Users discover features through exploration
- Users identify value in features
- Users provide constructive feedback on discoverability
- Users can complete tasks without extensive guidance
- Visual indicators are understood and helpful
- Layout notation is comprehensible
- Users express surprise or delight at discovered features

---

## Testing Notes Template

**Session Date:** _______________  
**Participant ID:** _______________  
**Tester Name:** _______________  
**Duration:** _______________

### Key Observations

**Comprehension:**
- 
- 
- 

**Discoverability:**
- 
- 
- 

**Usefulness:**
- 
- 
- 

**User Quotes:**
- 
- 
- 

**Struggles/Confusion:**
- 
- 
- 

**Surprises/Discoveries:**
- 
- 
- 

**Unexpected Behaviors:**
- 
- 
- 

### Recommendations
- 
- 
- 

---

## Appendix: Quick Reference Checklist

### Pre-Session Checklist
- [ ] Prototype is running and accessible
- [ ] Browser cache cleared
- [ ] Screen recording software ready
- [ ] Note-taking template prepared
- [ ] Participant briefed (open-ended approach)
- [ ] Consent form signed (if required)

### Post-Session Checklist
- [ ] All tasks completed or attempted
- [ ] Rating questions answered
- [ ] Questionnaire completed
- [ ] Observations documented
- [ ] Screen recording saved (if applicable)
- [ ] Notes organized
- [ ] Follow-up scheduled (if needed)

---

**End of Usability Testing Plan**
