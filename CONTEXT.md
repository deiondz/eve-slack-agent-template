# Eve Agent App

This app hosts a general-purpose Slack agent whose capabilities include a daily stand-up workflow for collecting and publishing employee updates.

## Stand-up workflow

**Stand-up day**:
A workday for which the workflow collects plans and accomplishments from employees.
_Avoid_: Report date, task date

**Morning plan**:
An employee's appendable list of work they intend to do during a stand-up day.
_Avoid_: Morning tasks, morning report

**Evening accomplishment**:
An employee's appendable list of work they completed or worked on during a stand-up day, whether reported midday or at day's end.
_Avoid_: Evening tasks, completion report

**Stand-up digest**:
The authoritative shared presentation of either morning plans or evening accomplishments for one stand-up day.
_Avoid_: Summary post, stand-up list

**Employee**:
A configured Slack member who can manage their own morning plans and evening accomplishments.
_Avoid_: User, participant

**Manager**:
A configured Slack member who can manage stand-up entries for every employee and stand-up day.
_Avoid_: Admin, owner
