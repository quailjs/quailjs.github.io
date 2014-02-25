<?php
mysql_connect();
mysql_select_db('acheck');
$tests = json_decode(file_get_contents('../src/resources/tests.json'));
foreach($tests as &$test) {
	$test->guidelines = array();
	if(!$test->oac) {
		continue;
	}
	$result = mysql_query('select distinct gu.title, (SELECT text from language_text WHERE term = g.name) as groupname,
(SELECT text from language_text WHERE term = s.name) as subgroupname  
FROM subgroup_checks c
LEFT JOIN guideline_subgroups s ON s.subgroup_id = c.subgroup_id
LEFT JOIN guideline_groups g ON g.group_id = s.group_id
LEFT JOIN guidelines gu ON gu.guideline_id = g.guideline_id
where c.check_id = '. $test->oac .'
and gu.guideline_id NOT IN (1, 3)');
	while($row = mysql_fetch_array($result)) {
		var_dump($row);
		if($row['title'] == '508') {
			$thing = explode(' - ', $row['groupname']);
			$thing = trim($thing[0]);
		}
		if($row['title'] == 'wcag1a' || $row['title'] == 'wcag1aa' || $row['title'] == 'wcag1aaa') {
			$thing = explode(' ', trim($row['subgroupname']));
			$thing = $thing[0];
			$thing = $row['groupname'] .': '. $thing;
		}
		if($row['title'] == 'wcag2a' || $row['title'] == 'wcag2aa' || $row['title'] == 'wcag2aaa') {
			$thing = explode(' ', trim($row['groupname']));
			$thing = $thing[0];
		}		
		$test->guidelines[$row['title']] = $thing;
	}
	
}
$f = fopen('tests.json', 'w');
fwrite($f, json_encode($tests));
fclose($f);