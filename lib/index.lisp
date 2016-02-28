void

(letrec
	(printList a) (if (unit? a) 0 {
		(printList (head a))
		(echo (tail a))
	})
	ls [1 2 3 4 5]
	(printList ls))

(echo true)

(let
	(ADD a b) (a + b)
	(echo (2 `ADD 1)))

(echo true)
