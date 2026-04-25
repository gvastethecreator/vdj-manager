---
title: "VirtualDJ - VDJPedia - Skin GrabZone"
source: "https://www.virtualdj.com/wiki/Skin%20GrabZone.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

**Skin SDK: The _<grabzone>_ element**

---

---

A grabzone defines a zone that can be used to move the VirtualDJ's window if it is not maximized. If no grabzone is defined, any zone that is not a defined element acts as a grabzone.

**Attributes:** None

**Children:**

- _<pos x="" y="">_ : Give the (x,y) position the grab zone will have on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- _<size width="" height=""/>_ : Give the width and the height that the grab zone will have on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)

**Example:**

```
<grabzone>
	<pos x="0" y="0"/>
	<size width="1920" height="30"/>
</grabzone>
```

---

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)
