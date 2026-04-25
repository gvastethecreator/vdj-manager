---
title: "VirtualDJ - VDJPedia - Skin SDK Panel"
source: "https://www.virtualdj.com/wiki/Skin%20SDK%20Panel.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<panel>* container**

---

---

  
A panel is a zone that groups together several other skin elements, in order to hide or show all of them at once.  
Panels are very useful if you want to put several groups of elements on the same place, and switch from one group to another with a button or a shortcut.  
  
**Syntax:** *<panel visible="" name="" group="" visibility="">*.  
  
**Attributes** :  

- *visible=""* or *visibility=""*: *"yes"* to have it shown at the beginning (when the skin is loaded), or *"no"* to have it hidden. [VDJ Script](https://www.virtualdj.com/wiki/VDJ8Script.html) actions that return true/false can be used to set the visibility of a panel.
- *name=""* : Every element which has a *panel=""* equal to this *name* will belong to this panel. The name attribute is also used to store the visibility of the grouped panels across sessions.
- *group=""* (optional) : Only one panel from a common group can be shown at a time (that means that when you show a panel belonging to a group, all the other panels from that group will be hidden) - this is optional if you choose to control via visibility.

  
  
**Children** (All are optional) :  

- *<size width="" height=""/>* : Give the width and height of the panel
- *<pos x="" y=""/>* : Give the position of the panel on the screen
- *<down x="" y=""/>* : Give the coordinate of the graphic to use when the panel is displayed
- *<up x="" y=""/>* : Give the coordinate of the graphic to use to erase the panel when it is hidden
- *<clipmask x="" y=""/>* : Give the coordinate of the B&W graphic that should be used as a clip mask when drawing the panel

  
  
A much more preferred way to display some graphics as a background of a <panel> is to use a <visual> element. In case no special background graphics are needed for the panel, the <pos> and <size> children are not really needed. Note that an element nested in a <panel> will still be displayed even if the <element> is positioned outside the panel boundaries.  
  
Example using *visibility* attribute and VDJ Script actions returning true/false.  
In this case, the panels (and their nested elements) will be displayed based on the visibility query and the status will not be stored across sessions.  
  
```
<panel visibility="loop">
	<!-- Every element placed here will be displayed only if the visibility is true (deck is in loop)-->
	<button ...>
		....
	</button>
	......
</panel>

<panel visibility="not loop">
	<!-- Every element placed here will be displayed only if the visibility is true (deck is not in loop)-->
	<button ...>
		....
	</button>
	......
</panel>
```
  
  
  
  
Example using *name*, *group* and *visible* attributes for manual display.  
In this case the 1st panel with visible="yes" will be displayed when the skin loads for the first time, the user will have to manually show/hide a panel (using the skin button or a shortcut) and the current displaying status of the group will be saved across sessions.  
  
```
<panel group="loops" name="autoloops" visible="yes">
	<button ...>
		....
	</button>
	......
</panel>

<panel group="loops" name="manualloops" visible="no">
	<button ...>
		....
	</button>
	......
</panel>

<!-- In this case you may need to add a button to explicitly hide/show a panel or cycle through the panels of the group.-->
<button action="skin_panelgroup 'loops'' +1">
	....
</button>
```
  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)