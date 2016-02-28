void

(echo ">> testing strings")
(echo ("abc" . "length"))

(echo ">> testing letrec")
(letrec
	(printList a) (if (unit? a) 0 {
		(printList (head a))
		(echo (tail a))
	})
	(concat a b) (if (unit? b) a
		((concat a (head b)) , (tail b)))
	(printList (concat [1 2 3] [4 5 6])))

(echo ">> testing letrec/let/macro")
(letrec
	($ADD a b) (a + b)
	(echo ($ADD 1 2)))
(let
	($ADD a b) (a + b)
	(echo ($ADD 1 2)))
(macro
	($ADD a b) (a + b)
	(echo ($ADD 1 2)))
