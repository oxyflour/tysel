let
(assertEq a b) (if (a == b) 0 (throw 1))
{
    (letrec
        (testArray a b) (if (unit? a) 0 {
            (testArray (head a) (head b))
            (assertEq (tail a) (tail b))
        })
        (concat a b) (if (unit? b) a
            ((concat a (head b)) , (tail b)))
        (testArray
            (concat [1 2 3] [4 5])
            [1 2 3 4 5]))

    (letrec
        ($ADD a b) (a + b)
        (assertEq ($ADD 1 2) 3))
    (let
        ($ADD a b) (a + b)
        (assertEq ($ADD 1 2) 3))
    (macro
        ($ADD a b) (a + b)
        (assertEq ($ADD 1 2) 3))

    (assertEq ((cast "a" 0) + (cast "b" 0)) (cast "ab" 0))

    (assertEq ("abc" . "length") 3)
}
