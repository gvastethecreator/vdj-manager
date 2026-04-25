---
title: "VirtualDJ - VDJPedia - Skin Browser"
source: "https://www.virtualdj.com/wiki/Skin%20Browser.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<browser>* element**

---

---

  
The browser element sets the space that will be used to draw VirtualDJ's Browser (Folders list, Songs List, Sideview, Info). [Custom Browsers](https://www.virtualdj.com/wiki/Custom%20Browser.html) is also possible using [<split> panels](https://www.virtualdj.com/wiki/Split%20panel.html). Browsers can be nested in panels and have visibility=""  
  
**Syntax** : *<browser panel="" visibility="" toolbar="" sideview="" folders="" infos="" effects="" searchbar="" lineheight="" showzoom="">*  
  
**Attributes:**  

- *visibility=""* : Define the % transparency of the displayed graphics and texts. [VDJ Script](https://www.virtualdj.com/wiki/VDJScript.html) actions that return true or false to specify when the element will be visible or not. Tip: if you have lots of elements with the same visibility, it is suggested and less cpu consuming to nest all elements inside a <panel> or a <group> container with the same visibility (see [Panel](https://www.virtualdj.com/wiki/Skin%20SDK%20Panel.html) and [Group](https://www.virtualdj.com/wiki/Skin%20Group.html))
- *panel=""* : Provide the name of the panel that the Browser is part of. The Browser will be displayed only when the panel is visible. Should be avoided. It is suggested to nest elements inside a <panel> container (see [Panel](https://www.virtualdj.com/wiki/Skin%20SDK%20Panel.html))
- *toolbar="yes|no"* : Whether or not to display the toolbar on the left of the browser (default="yes")
- *sideview="yes|no"* : Whether or not to display the sideview (default="yes")
- *folders="yes|no"* : Whether or not to display the folder list (default="yes")
- *infos="yes|no"* : Whether or not to display the info panel (default="yes")
- *effects="yes|no"* : Whether or not to display the effects section (default="yes")
- *searchbar="yes|no"* : Whether or not to display the search toolbar above the file list (default="yes")
- *lineheight=""* : Define the percentage of the height between 2 browser lines (default 1). E.g. lineheight="2.0" will provide double height than the default
- *showzoom="yes|no"* : Whether or not to display a button in the Folders vertical toolbar to toggle between zoomed and normal browser. (display Browser based on *browser\_zoom* query)

  
**Children:**  

- *<pos x="" y=""/>* : Give the position of the Browser on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Give the width and height of the Browser. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<colors background="">* set the background. transparent can be used to create a transparent background. Note that in this case, it is strongly advised to set skin breakline and breakline2 in order to prevent issues when stretching the browser. Colors then has children of it's own:  
\[list\]
- *<separators line="#7E7E7E"/>*
- *<toolbars background="#393939" text="#FFFFFF" iconbackground="#1E1E1E" border="#6D6D6D" label="#A0A0A0" backgroundselected="#646464" backgroundmouseover="#464646" quickfilter\_down="#2f3032" quickfilter\_over="#565758" quickfilter\_selected="#4d4e52" quickfilter\_border="#242424"/>*
- *<lists background="#202020" stripes="#2A2A2A" over="#252525" overstripes="#2F2F2F" selected="#555555" focus="#7A7A7A" text="#FFFFFF" overtext="#FFFFFF" selectedtext="#FFFFFF" focustext="#FFFFFF" automix="#4080C4" livefeedback="#FFC4C4" download="#FF4040" scan="#FF4040" button="#3D3D3D" buttonactive="#838383" insert="#FF0000" label="#A0A0A0"/>*
- *<grids background="#2A2A2A" over="#2F2F2F" selected="#555555" focus="#7A7A7A" text="#FFFFFF" overtext="#FFFFFF" selectedtext="#FFFFFF" focustext="#FFFFFF" stripes="#202020" overstripes="#2E2E2E" selectedstripes="#2E2E2E" focusstripes="#2E2E2E" label="#7F7F7F" />*
- *<columns background="#454545" text="#FFFFFF" />*
- *<scrollbars background="#454545" button="#FFFFFF" />*
- *<info background="#393939" stripes="#303030" over="#555555" text="#FFFFFF" label="#A0A0A0" artist="#D5D5D5" title="#FFFFFF" />*
- *<search background="#1F1F1F" border="#7A7A7A" selected="#717171" text="#FFFFFF" cursor="#FFFFFF" />*
- *<prelisten background="#202020" border="#7A7A7A" selected="#136024" cursor="#18A639" button="#CBCBCB" buttonbackground="#5C5C5C" buttonselected="#18A639" />*
- *<plugins background="#cccccc" text="#FFFFFF" title="#5B5B5B" titletext="#FFFFFF" >  
<sliders background="#202020" needle="#FFFFFF" deck1="#136c8a" deck2="#ad3237" />  
</plugins>*

- *[<font/>](https://www.virtualdj.com/wiki/Skin%20Font.html)*
- *[<fontsearch/>](https://www.virtualdj.com/wiki/Skin%20Font.html)*
- *[<fontheader/>](https://www.virtualdj.com/wiki/Skin%20Font.html)*
- *[<fontgridtitle/>](https://www.virtualdj.com/wiki/Skin%20Font.html)*
\[\*\] *[<pluginzone/>](https://www.virtualdj.com/wiki/Skin%20PluginZone.html)*  
\[/list\]  
  
Only position is required, all other elements are optional.  
  
**Example 1:**  
```
<browser visibility="not browser_zoom">
	<pos x="13" y="547" width="1898" height="525" />
</browser>
<browser visibility="browser_zoom">
	<pos x="13" y="547-300" width="1898" height="525+300" />
</browser>
```
  
  
**Example 2:**  
```
<browser toolbar="yes" sideview="yes" folders="yes" infos="yes" effects="yes" searchbar="yes">
	<pos x="13" y="547" width="1898" height="525" />
	<colors background="#202020">
		<separators line="#7E7E7E"/>
		<toolbars background="#393939" text="#FFFFFF" iconbackground="#1E1E1E" border="#6D6D6D" label="#A0A0A0" backgroundselected="#646464" backgroundmouseover="#464646"/>
		<lists background="#202020" stripes="#2A2A2A" over="#252525" overstripes="#2F2F2F" selected="#555555" focus="#7A7A7A" text="#FFFFFF" overtext="#FFFFFF" selectedtext="#FFFFFF" focustext="#FFFFFF" automix="#4080C4" livefeedback="#FFC4C4" download="#FF4040" scan="#FF4040" button="#3D3D3D" buttonactive="#838383" insert="#FF0000" />
		<grids background="#2A2A2A" over="#2F2F2F" selected="#555555" focus="#7A7A7A" text="#FFFFFF" overtext="#FFFFFF" selectedtext="#FFFFFF" focustext="#FFFFFF" stripes="#202020" overstripes="#2E2E2E" selectedstripes="#2E2E2E" focusstripes="#2E2E2E" label="#7F7F7F" />
		<columns background="#454545" text="#FFFFFF" />
		<scrollbars background="#454545" button="#FFFFFF" />
		<info background="#393939" stripes="#303030" text="#FFFFFF" label="#A0A0A0" artist="#D5D5D5" title="#FFFFFF" />
		<search background="#1F1F1F" border="#7A7A7A" selected="#717171" text="#FFFFFF" cursor="#FFFFFF" />
		<prelisten background="#1F1F1F" border="#7A7A7A" selected="#136024" cursor="#18A639" button="#CBCBCB" buttonbackground="#5C5C5C" buttonselected="#18A639" />
	</colors>
	<fontsearch size="20"/>
	<font size="20" />
	<fontheader size="20" />
	<fontgridtitle size="20" />
</browser>
```
  
  
  
**Custom Browser**  
To create your own custom Browser, see [Custom Browser](https://www.virtualdj.com/wiki/Custom%20Browser.html)  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)