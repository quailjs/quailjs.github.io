<?php
/*! QUAIL quail-lib.org | quail-lib.org/license */
/**
 * Processes all the OAC tests as well as the related QUAIL test name
 * and creates a markdown table for posterity. Only works on Mac/Linux.
 */

$tests = json_decode(file_get_contents('tests.json'));

print "|_. Test Name |_. 508 |_. WCAG 1.0 A |_. WCAG 1.0 AA |_. WCAG 1.0 AAA |_. WCAG 2.0 A |_. WCAG 2.0 AA |_. WCAG 2.0 AAA |_. Reviewed |\n";

foreach($tests as $testname => $test) {
  print "| ". $testname . "| " .$test->guidelines->{508} . "| " .$test->guidelines->wcag1a . "| " .$test->guidelines->wcag1aa . "| " .$test->guidelines->wcag1aaa . "| " .$test->guidelines->wcag2a. "| " .$test->guidelines->wcag2aa. "| " .$test->guidelines->wcag2aaa ."| no |\n";
}