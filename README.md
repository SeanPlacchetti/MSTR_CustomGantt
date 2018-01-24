# MSTR_CustomGantt
A Custom Gantt chart view developed with D3 for use in Microstrategy Visual Insight

This chart was created using original source code by Aaron Lampros - https://github.com/alampros/Gantt-Chart 

The wiki for this visualizaton is hosted here https://github.com/SeanPlacchetti/MSTR_CustomGantt/wiki

In the language of MicroStrategy Visual Insight, to generate the chart the data requirements are a minimum of **4 attributes and 1 metric**.  The attributes should include a **"Parent"** attribute, a **"Child"** attribute that is tied to the "Parent" attribute, along with **"Start Date"** and **"End Date"** attributes.  The single metric should ba a **percentage (i.e. XX%)**, which is used to draw the inner progress bar on each task. An empty value for the percentage metric will result in no progress bar being shown.
