---
title: "VirtualDJ - VDJPedia - Skin menu"
source: "https://www.virtualdj.com/wiki/Skin%20menu.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<menu>* element**

---

---

  
Defines an area on your screen, where a menu will be offered when clicked and also defines the content of this menu.  
  
  
The syntax of the menu element is *<menu>* and has no attributes.  
  
**Children:**  

- *<pos x="" y="" />* : Give the position top-left X,Y pos of the area on the screen where the menu will be offered when clicked. Read further in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height="" />* : Give the width and height of the area on the screen where the menu will be offered when clicked.  
  
**Graphics** : You can either point to a part in your skin image using x,y coordinates ...
- *<up x="" y="" />* : Give the coordinate of the graphic to use while the menu is not displayed
- *<over x="" y="" />* : Give the coordinate of the graphic to use when mouse is over the menu area
- *<down x="" y="" />* : Give the coordinate of the graphics to use while the menu is displayed  
  
..or using vector graphics in your xml ...  
*<up shape="" color="" border="" border\_size="" radius="" gradient="" color2=""/>*  
(and same for *<down>* and *<over>.* See [Skin button](https://www.virtualdj.com/wiki/Skin%20Button.html)  
  
**Menu Items:**
- *<item text="" action="" check="" hascheck="" visibility="" />* : Use an item child for each item offered from the menu. The item child has the following parameters.\[list\]
- *text="" :* Provide the displayed text of the menu item. Have *text="-"* to display a separator line in your menu, instead of an item
- *action="" :* Provide a [VDJ Script](https://www.virtualdj.com/wiki/VDJScript.html) action that will be executed when the menu item is clicked.
- *hascheck="" :* If set to *true* (default value) , the menu item will offer a check-mark depending of the true/false status of the action or the check parameters. If hascheck is set to *false*, then no check-mark will be offered for the menu item, regardless the status of the action and check parameters..
- *check="" :* A check-mark will be displayed at the left side of the menu item, if the action of the check parameter returns true. If no check parameter is provided, the check-mark will be displayed if the action parameter returns true.
- *visibility=""*: Provide a [VDJ Script](https://www.virtualdj.com/wiki/VDJScript.html) action that returns true|false to show/hide a menu item under certain conditions.

  
- *<separator/>* : Adds a break line into the menu.  
**Sub-menus:**
\[\*\]*<submenu text="" >* : A menu can have nested menus. Use the submenu child to nest other items  
\[/list\]  
  
  
**Example** : The following code ...  
```
<menu>
	<pos y="315" x="324"/>
	<size width="14" height="14"/>
	<off y="1683" x="757"/>
	<over y="1683" x="777"/>
	<down y="1683" x="777"/>
	<item text="Edit CUEs and POIs..." action="edit_poi" hascheck="false"/>
	<item text="Read-only (Lock)" action="lock_cues" hascheck="true"/>
	<item text="Smart Cue" action="smart_cue" hascheck="true"/>
	<item text="Quantize on Set" action="quantize_setcue" hascheck="true"/>
	<item text="-"/>
	<submenu text="Display mode">
		<item text="Cue number" action="cue_display 'number'" hascheck="true"/>
		<item text="Name" action="cue_display 'name'" hascheck="true"/>
		<item text="Time Pos" action="cue_display 'position'" hascheck="true"/>
		<item text="Time left" action="cue_display 'distance'" hascheck="true"/>
		<item text="Beats left" action="cue_display 'beat'" hascheck="true"/>
	</submenu>
</menu>
```
  
... provides the following menu when the gray dot is clicked.  
![](https://www.virtualdj.com/img/226635/77527/menu.png)  
  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)