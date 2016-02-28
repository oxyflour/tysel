letrec
	(printList a) (if (unit? a) 0 {
		(printList (head a))
		(echo (tail a))
	})
	(printList [1 2 3 4 5])
