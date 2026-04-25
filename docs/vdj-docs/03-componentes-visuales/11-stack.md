---
title: "VirtualDJ - VDJPedia - Skin Stack"
source: "https://www.virtualdj.com/wiki/Skin%20Stack.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<stack>* element**

---

---

  
You can show skin elements in a *stack* way. The stack is a *container* and can have multiple slots (display areas) and multiple items (skin elements) to be displayed in the slots. Each item will be shown in a available slot with priority. E.g a stack can have 2 slots (display areas) and 10 items with visibility. The stack will display only the last 2 "visible" items.  
  
**Parameters:**  

- *fadein=""* : (optional) Define the time in ms in which the items of the stack will fade in (from nothing to full display). E.g. fadein="200ms"
- *fadeout=""* : (optional) Define the time in ms in which the items of the stack will fade out (from full display to nothing). E.g. fadeout="500ms"

  
**Children:** :  

- *<size width="" height=""/>* : Define the width and height of the slot.
- *<slot x="" y="">* : Can have multiple slots. Each slot can have x="" and y="" parameters to define the position of the slots inside the skin. Obviously, multiple slots will need different positions or else they will be displayed in the same area.
- *<item>* : Can have multiple <item>s, in most cases the amount of <item>s will be larger than the amount of <slot>s. Any skin element can be nested inside a <item></item>. Items can have visibility="" and class="" as parameters (same as <panel>).

  
  
**Example:**  
  
```
<stack fadein="200ms" fadeout="500ms">
	<size width="370" height="170"/>
	<slot x="-370" y="170+20+170+20+170" />
	<slot x="-370" y="170+20+170"/>
	<slot x="-370" y="170"/>

	<item class="looppanel" visibility="is_using 'loop' 8000ms"></item>
	<item class="eqpanel" visibility="is_using 'equalizer' 1000ms"></item>
	<item class="filterpanel" visibility="is_using 'filter' 1000ms"></item>

	<item class="cuepanel" visibility="is_using 'cue' 1000ms"></item>
	<item class="samplerpanel" visibility="is_using 'sample' 1000ms 8000ms"></item>
	<item class="fxpanel" visibility="is_using 'effect' 1000ms 8000ms"></item>

	<item  class="padspanel" visibility="is_using 'pads' 1000ms"></item>
	<item class="nexttrackpanel" visibility="is_using 'load' 5000ms"></item>
				
</stack>
```
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)