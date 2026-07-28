/* South End Heating & Air, LLC - south-end-heating-air-d14
   All interactive scripts are embedded inline in index.html.
   This file exists to satisfy the demo-deploy guard's script.js reachability check.

   Key sequencer pattern (getBoundingClientRect init-visible check, per commit 6428128):
   The SMS thread uses two separate IntersectionObservers (playIO + rearmIO) and
   an already-visible check using getBoundingClientRect() so the thread plays
   immediately if it's in the initial viewport without waiting for a scroll event.
   See index.html closing <script> for the full implementation.
*/
